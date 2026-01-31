provider "aws" {
  region = "ap-northeast-2"
}

# VPC
resource "aws_vpc" "lms_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  tags                 = { Name = "lms-vpc" }
}

# IGW(VPC대문)
resource "aws_internet_gateway" "lms_igw" {
  vpc_id = aws_vpc.lms_vpc.id
  tags   = { Name = "lms-igw" }
}

#  RoutingTable (internet으로 길안내)
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.lms_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.lms_igw.id
  }
  tags = { Name = "lms-public-rt" }
}

# RoutingTable - Public Subnet Connect (1,2 모두)
resource "aws_route_table_association" "public_1_assoc" {
  subnet_id      = aws_subnet.public_subnet.id
  route_table_id = aws_route_table.public_rt.id
}

resource "aws_route_table_association" "public_2_assoc" {
  subnet_id      = aws_subnet.public_subnet_2.id
  route_table_id = aws_route_table.public_rt.id
}

# ALB Public Subnet
# 가용성으로 2a에 불이나도 ALB접점이 살아있게 2개 만들어놓는다.
resource "aws_subnet" "public_subnet" {
  vpc_id                  = aws_vpc.lms_vpc.id
  cidr_block              = "10.0.1.0/24"
  map_public_ip_on_launch = true # 공인 IP 자동 할당
  availability_zone       = "ap-northeast-2a"
  tags                    = { Name = "lms-public-sn" }
}

resource "aws_subnet" "public_subnet_2" {
  vpc_id                  = aws_vpc.lms_vpc.id
  cidr_block              = "10.0.3.0/24"
  map_public_ip_on_launch = true
  availability_zone       = "ap-northeast-2c" # 다른 AZ
  tags                    = { Name = "lms-public-sn-2" }
}

# EC2 Private Subnet (단일 AZ)
resource "aws_subnet" "private_subnet" {
  vpc_id            = aws_vpc.lms_vpc.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "ap-northeast-2a"
  tags              = { Name = "lms-private-sn" }
}

resource "aws_subnet" "private_subnet_2" {
  vpc_id            = aws_vpc.lms_vpc.id
  cidr_block        = "10.0.4.0/24"
  availability_zone = "ap-northeast-2c"
  tags              = { Name = "lms-private-sn-2" }
}

#  DB 서브넷 그룹 (인스턴스가 위치할 수 있는 후보지 목록)
resource "aws_db_subnet_group" "lms_db_sn_group" {
  name       = "lms-db-subnet-group"
  subnet_ids = [aws_subnet.private_subnet.id, aws_subnet.private_subnet_2.id]
  tags       = { Name = "lms-db-sn-group" }
}

# Security Group
resource "aws_security_group" "app_sg" {
  name   = "app-sg"
  vpc_id = aws_vpc.lms_vpc.id

  # 웹 서비스용 (누구나 접속 가능 - Direct Access)
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS
  ingress {
    from_port   = 443 #  백엔드 포트
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ## SSH 접속 (내 IP만 허용)
  ingress {
    description = "Allow SSH from My IP"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["${chomp(data.http.myip.response_body)}/32"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Amazon Linux 2023 AMI ID 가져오기
data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }
}

resource "aws_instance" "app_server" {
  ami           = data.aws_ami.amazon_linux_2023.id
  instance_type = "t3.micro"

  # 루트 볼륨 크기 지정 (기본 8GB -> 30GB)
  root_block_device {
    volume_size           = 30
    volume_type           = "gp3"
    delete_on_termination = true
    tags                  = { Name = "lms-root-volumn" }
  }

  ## Bastion Host (중간 다리 컴퓨터 jump-server) 아니면 AWS SSM(시스템 매니저) 사용 지금은 public으로 개발자가 접속 가능하게
  subnet_id              = aws_subnet.public_subnet.id
  vpc_security_group_ids = [aws_security_group.app_sg.id]
  key_name               = "lms-key" #미리 생성한 키 페어 이름

  ## 공인 IP 강제 할당
  associate_public_ip_address = true

  ## IMDSv2 설정 ( 토큰 기반 세션을 요구 )
  metadata_options {
    http_tokens                 = "required"
    http_endpoint               = "enabled"
    http_put_response_hop_limit = 1
  }

  # EC2  생성 시 자동으로 실행될 스크립트
  user_data = <<-EOF
                #!/bin/bash
                # Swap 메모리 설정 (2GB)
                fallocate -l 2G /swapfile
                chmod 600 /swapfile
                mkswap /swapfile
                swapon /swapfile
                echo '/swapfile none swap sw 0 0' >> /etc/fstab

                # 기초 패키지 설치
                dnf update -y
                dnf install -y docker
                systemctl start docker
                systemctl enable docker
                usermod -aG docker ec2-user

                # Docker Compose 설치
                mkdir -p /usr/local/lib/docker/cli-plugins/

                COMPOSE_VERSION="v5.0.1"
                curl -SL "https://github.com/docker/compose/releases/download/$${COMPOSE_VERSION}/docker-compose-linux-x86_64" -o /usr/local/lib/docker/cli-plugins/docker-compose

                chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

                # 설치 확인
                docker compose version
                EOF

  tags = { Name = "lms-app-server" }
}

# 내 현재 IP를 자동으로 가져오는 데이터 소스
data "http" "myip" {
  url = "https://ipv4.icanhazip.com"
}

# RDS Security Group (EC2에서만 접근 가능)
resource "aws_security_group" "rds_sg" {
  name   = "rds-sg"
  vpc_id = aws_vpc.lms_vpc.id

  # PostgreSQL 포트 (EC2 Security Group에서만 허용)
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app_sg.id]
    description     = "Allow PostgreSQL from EC2"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "lms-rds-sg" }
}

# RDS PostgreSQL Instance (단일 AZ)
resource "aws_db_instance" "postgres" {
  identifier     = "lms-postgres"
  engine         = "postgres"
  engine_version = "17.6"
  instance_class = "db.t3.micro" # 프리티어

  # 단일 AZ 설정
  multi_az               = false             # 대기  인스턴스 생성 안 함
  availability_zone      = "ap-northeast-2a" # 특정 AZ에고정
  db_subnet_group_name   = aws_db_subnet_group.lms_db_sn_group.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]

  # 스토리지 설정
  allocated_storage     = 20
  max_allocated_storage = 100 # 자동 확장 최대치
  storage_type          = "gp3"
  storage_encrypted     = true

  # 데이터베이스 설정
  db_name  = "eduops_db"
  username = "eduops"
  password = var.db_password # variables.tf에서 정의

  # 삭제 방지 설정
  publicly_accessible = false
  deletion_protection = var.rds_deletion_protection
  skip_final_snapshot = var.rds_skip_final_snapshot

  tags = { Name = "lms-postgres" }
}

# RDS 엔드포인트 출력
output "rds_endpoint" {
  description = "RDS PostgreSQL 엔드포인트"
  value       = aws_db_instance.postgres.endpoint
}

output "rds_connection_string" {
  description = "RDS 연결 문자열 (비밀번호 제외)"
  value       = "postgresql://${aws_db_instance.postgres.username}:PASSWORD@${aws_db_instance.postgres.endpoint}/${aws_db_instance.postgres.db_name}"
  sensitive   = true
}

output "ec2_public_ip" {
  description = "EC2 퍼블릭 IP"
  value       = aws_instance.app_server.public_ip
}


# sudo pacman -S terraform

# terraform init : AWS대화 준비 (플러그인 설치)
# terraform plan: 플랜대로 어떻게 될지 preview
# terraform apply: 실제로 구축을하라 (인프라  생성)
# terraform destroy : 구축한 인프라 철거

# terraform 은 aws인프라에 문서화 역활도 합니다.

# aws configure시 나온 유의의 정책에 EC2정책을 부여해줍니다.(VPC 생성은 EC2 서비스 범주에 들어감)
# lms-key 라는 키페어가 있어야 되며 없으면 생성 (추후 github actions나  터미널에서 서버에 들어갈때(SSH접속)사용 합니다.)
