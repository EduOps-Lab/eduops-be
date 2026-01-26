#!/bin/bash
set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m]'
NC='\033[0m' # No Color

echo -e "${BLUE}=== 무중단 배포 시작 ===${NC}"

# 환경 변수 로드
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Prisma 마이그레이션 실행( 현재 활성 환경)
echo -e "${YELLOW}=== Prisma 마이그레이션 실행 (동기화) === ${NC}"

# 현재 실행 중인 컨테이너 확인
BLUE_RUNNING=$(docker ps -q -f name=eduops-backend-blue -f status=running)
GREEN_RUNNING=$(docker ps -q -f name=eduops-backend-green -f status=running)

if [ -n "$BLUE_RUNNING" ]; then
    CURRENT="blue"
    CURRENT_PORT=4000
    CURRENT_CONTAINER="eduops-backend-blue"
    echo -e "${GREEN}현재 Blue 환경이 실행 중입니다.${NC}"
    echo -e "${YELLOW}Blue 환경에 Prisma 마이그레이션 실행 중...${NC}"
    
    # Blue 컨테이너에서 마이그레이션 실행
    if docker exec eduops-backend-blue npx prisma migrate deploy; then
        echo -e "${GREEN}Blue 환경 Prisma 마이그레이션 성공!${NC}"
    else
        echo -e "${RED}Blue 환경 Prisma 마이그레이션 실패!${NC}"
        exit 1
    fi
    
elif [ -n "$GREEN_RUNNING" ]; then
    CURRENT="green"
    CURRENT_PORT=4001
    CURRENT_CONTAINER="eduops-backend-green"
    echo -e "${GREEN}현재 Green 환경이 실행 중입니다.${NC}"
    echo -e "${YELLOW}Green 환경에 Prisma 마이그레이션 실행 중...${NC}"
    
    # Green 컨테이너에서 마이그레이션 실행
    if docker exec eduops-backend-green npx prisma migrate deploy; then
        echo -e "${GREEN}Green 환경 Prisma 마이그레이션 성공!${NC}"
    else
        echo -e "${RED}Green 환경 Prisma 마이그레이션 실패!${NC}"
        exit 1
    fi
    
else
    echo -e "${YELLOW}실행 중인 컨테이너가 없습니다.${NC}"
    echo -e "${YELLOW}Prisma 마이그레이션은 새 컨테이너 시작 후 실행됩니다.${NC}"
    CURRENT="none"
    CURRENT_CONTAINER=""
fi

# 새 컨테이너 시작
if [ -n "$BLUE_RUNNING" ]; then
    TARGET="green"
    TARGET_PORT=4001
    OLD_CONTAINER="eduops-backend-blue"
    NEW_CONTAINER="eduops-backend-green"
    NEW_SERVICE="backend-green"
elif [ -n "$GREEN_RUNNING" ]; then
    TARGET="blue"
    TARGET_PORT=4000
    OLD_CONTAINER="eduops-backend-green"
    NEW_CONTAINER="eduops-backend-blue"
    NEW_SERVICE="backend-blue"
else
    TARGET="blue"
    TARGET_PORT=4000
    NEW_CONTAINER="eduops-backend-blue"
    NEW_SERVICE="backend-blue"
fi

# 새 컨테이너 시작
echo -e "${YELLOW}[$TARGET] 컨테이너 시작 중...${NC}"

if [ "$TARGET" = "green" ]; then
    docker compose --profile green up -d backend-green
else
    docker compose up -d backend-blue
fi

# 컨테이너 실행 대기
echo -e "${YELLOW}[$TARGET] 컨테이너 실행 대기 중...${NC}"
RETRY_COUNT=0
MAX_RETRIES=12
CONTAINER_READY=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    sleep 5
    CONTAINER_STATUS=$(docker ps -q -f name=$NEW_CONTAINER -f status=running)
    
    if [ -n "$CONTAINER_STATUS" ]; then
        echo -e "${GREEN}[$TARGET] 컨테이너 실행 완료!${NC}"
        CONTAINER_READY=true
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo -e "${YELLOW}[$TARGET] 컨테이너 실행 대기 중... ($RETRY_COUNT/$MAX_RETRIES)${NC}"
    
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        echo -e "${RED}[$TARGET] 컨테이너 실행 실패!${NC}"
        docker compose logs $NEW_SERVICE
        docker compose stop $NEW_SERVICE
        exit 1
    fi
done

# Prisma 마이그레이션 (새 컨테이너)
if [ "$CONTAINER_READY" = true ]; then
    echo -e "${YELLOW}[$TARGET] 환경에 Prisma 마이그레이션 실행 중...${NC}"
    
    if docker exec $NEW_CONTAINER npx prisma migrate deploy; then
        echo -e "${GREEN}[$TARGET] 환경 Prisma 마이그레이션 성공!${NC}"
    else
        echo -e "${RED}[$TARGET] 환경 Prisma 마이그레이션 실패!${NC}"
        echo -e "${RED}새 컨테이너를 중지합니다.${NC}"
        docker compose stop $NEW_SERVICE
        exit 1
    fi
fi


# 헬스체크 대기 (실패 시 즉시 롤백)
echo -e "${YELLOW}[$TARGET] 헬스체크 대기 중 (최대 60초)...${NC}"
RETRY_COUNT=0
MAX_RETRIES=12
HEALTH_CHECK_FAILED=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    sleep 5
    HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$TARGET_PORT/health || echo "000")
    
    if [ "$HEALTH_STATUS" = "200" ]; then
        echo -e "${GREEN}[$TARGET] 헬스체크 성공! (HTTP $HEALTH_STATUS)${NC}"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo -e "${YELLOW}[$TARGET] 헬스체크 대기 중... ($RETRY_COUNT/$MAX_RETRIES)${NC}"
    
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        echo -e "${RED}[$TARGET] 헬스체크 실패!${NC}"
        HEALTH_CHECK_FAILED=true
        break
    fi
done

# 헬스체크 실패 시 롤백
if [ "$HEALTH_CHECK_FAILED" = true ]; then
    echo -e "${RED}[$TARGET] 헬스체크 실패! 즉시 롤백합니다.${NC}"
    
    # 새 컨테이너 로그 확인
    echo -e "${YELLOW}[$TARGET] 컨테이너 로그:${NC}"
    docker compose logs $NEW_CONTAINER
    
    # 새 컨테이너 중지
    echo -e "${YELLOW}[$TARGET] 컨테이너 중지 중...${NC}"
    docker compose stop $NEW_CONTAINER
    
    # 컨테이너 삭제 (리소스 확보)
    echo -e "${YELLOW}[$TARGET] 컨테이너 삭제 중...${NC}"
    docker compose rm -f $NEW_CONTAINER
    
    # Nginx 설정 원복 (현재 환경으로)
    if [ "$CURRENT" != "none" ]; then
        echo -e "${YELLOW}Nginx 설정 원복 중...${NC}"
        if [ "$CURRENT" = "blue" ]; then
            sed -i 's/# server backend-blue:4000;/server backend-blue:4000;/' nginx/conf.d/default.conf
            sed -i 's/server backend-green:4000;/# server backend-green:4000;/' nginx/conf.d/default.conf
        else
            sed -i 's/server backend-blue:4000;/# server backend-blue:4000;/' nginx/conf.d/default.conf
            sed -i 's/# server backend-green:4000;/server backend-green:4000;/' nginx/conf.d/default.conf
        fi
        docker compose exec -T nginx nginx -s reload
    fi
    
    echo -e "${RED}배포 중단 및 롤백 완료!${NC}"
    exit 1
fi

# Nginx 설정 전환
echo -e "${YELLOW}Nginx 설정을 [$TARGET]으로 전환합니다...${NC}"

if [ "$TARGET" = "green" ]; then
    sed -i 's/server backend-blue:4000;/# server backend-blue:4000;/' nginx/conf.d/default.conf
    sed -i 's/# server backend-green:4000;/server backend-green:4000;/' nginx/conf.d/default.conf
else
    sed -i 's/# server backend-blue:4000;/server backend-blue:4000;/' nginx/conf.d/default.conf
    sed -i 's/server backend-green:4000;/# server backend-green:4000;/' nginx/conf.d/default.conf
fi

# Nginx 설정 검증 및 리로드
echo -e "${YELLOW}Nginx 설정 검증 중...${NC}"
if docker compose exec -T nginx nginx -t; then
    echo -e "${GREEN}Nginx 설정 검증 성공!${NC}"
    docker compose exec -T nginx nginx -s reload
    echo -e "${GREEN}Nginx 설정 리로드 완료!${NC}"
else
    echo -e "${RED}Nginx 설정 검증 실패! 롤백합니다.${NC}"
    
    # Nginx 설정 원복
    if [ "$CURRENT" != "none" ]; then
        if [ "$CURRENT" = "blue" ]; then
            sed -i 's/# server backend-blue:4000;/server backend-blue:4000;/' nginx/conf.d/default.conf
            sed -i 's/server backend-green:4000;/# server backend-green:4000;/' nginx/conf.d/default.conf
        else
            sed -i 's/server backend-blue:4000;/# server backend-blue:4000;/' nginx/conf.d/default.conf
            sed -i 's/# server backend-green:4000;/server backend-green:4000;/' nginx/conf.d/default.conf
        fi
        docker compose exec -T nginx nginx -s reload
    fi
    
    # 새 컨테이너 중지
    docker compose stop $NEW_CONTAINER
    docker compose rm -f $NEW_CONTAINER
    
    exit 1
fi

# 이전 컨테이너 중지
if [ "$CURRENT" != "none" ]; then
    echo -e "${YELLOW}5초 후 [$CURRENT] 컨테이너를 중지합니다...${NC}"
    sleep 5
    
    echo -e "${YELLOW}[$CURRENT] 컨테이너 중지 중...${NC}"
    docker compose stop $OLD_CONTAINER
    
    # 컨테이너 삭제 (리소스 확보)
    echo -e "${YELLOW}[$CURRENT] 컨테이너 삭제 중...${NC}"
    docker compose rm -f $OLD_CONTAINER
    
    echo -e "${GREEN}[$CURRENT] 컨테이너 중지 및 정리 완료${NC}"
fi

# 최종 확인
echo -e "${YELLOW}최종 상태 확인 중...${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 최종 헬스체크
FINAL_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$TARGET_PORT/health || echo "000")
if [ "$FINAL_HEALTH" = "200" ]; then
    echo -e "${GREEN}최종 헬스체크 성공!${NC}"
else
    echo -e "${RED}최종 헬스체크 실패!${NC}"
    exit 1
fi

echo -e "${GREEN}=== 무중단 배포 완료! ===${NC}"
echo -e "${GREEN}현재 활성 완료: $TARGET${NC}"
echo -e "${GREEN}Prisma 마이그레이션: 완료${NC}"

