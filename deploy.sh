#!/bin/bash
set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== 무중단 배포 시작 ===${NC}"

# 환경 변수 로드
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# 현재 실행 중인 컨테이너 확인
BLUE_RUNNING=$(docker ps -q -f name=eduops-backend-blue -f status=running)
GREEN_RUNNING=$(docker ps -q -f name=eduops-backend-green -f status=running)

if [ -n "$BLUE_RUNNING" ]; then
    echo -e "${GREEN}현재 Blue 환경이 실행 중입니다.${NC}"
    CURRENT="blue"
    TARGET="green"
    TARGET_PORT=4001
    OLD_CONTAINER="eduops-backend-blue"
    NEW_CONTAINER="eduops-backend-green"
elif [ -n "$GREEN_RUNNING" ]; then
    echo -e "${GREEN}현재 Green 환경이 실행 중입니다.${NC}"
    CURRENT="green"
    TARGET="blue"
    TARGET_PORT=4000
    OLD_CONTAINER="eduops-backend-green"
    NEW_CONTAINER="eduops-backend-blue"
else
    echo -e "${YELLOW}실행 중인 컨테이너가 없습니다. Blue로 시작합니다.${NC}"
    CURRENT="none"
    TARGET="blue"
    TARGET_PORT=4000
    NEW_CONTAINER="eduops-backend-blue"
fi

# 새 컨테이너 시작
echo -e "${YELLOW}[$TARGET] 컨테이너 시작 중...${NC}"

if [ "$TARGET" = "green" ]; then
    docker compose --profile green up -d backend-green
else
    docker compose up -d backend-blue
fi

# 헬스체크 대기
echo -e "${YELLOW}[$TARGET] 헬스체크 대기 중 (최대 60초)...${NC}"
RETRY_COUNT=0
MAX_RETRIES=12

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
        echo -e "${RED}[$TARGET] 헬스체크 실패! 배포를 중단합니다.${NC}"
        docker-compose logs $NEW_CONTAINER
        docker-compose stop $NEW_CONTAINER
        exit 1
    fi
done

# Nginx 설정 전환
echo -e "${YELLOW}Nginx 설정을 [$TARGET]으로 전환합니다...${NC}"

if [ "$TARGET" = "green" ]; then
    sed -i 's/server backend-blue:4000;/# server backend-blue:4000;/' nginx/conf.d/default.conf
    sed -i 's/# server backend-green:4000;/server backend-green:4000;/' nginx/conf.d/default.conf
else
    sed -i 's/# server backend-blue:4000;/server backend-blue:4000;/' nginx/conf.d/default.conf
    sed -i 's/server backend-green:4000;/# server backend-green:4000;/' nginx/conf.d/default.conf
fi

# Nginx 설정 리로드
docker-compose exec -T nginx nginx -t
if [ $? -eq 0 ]; then
    docker-compose exec -T nginx nginx -s reload
    echo -e "${GREEN}Nginx 설정 리로드 완료!${NC}"
else
    echo -e "${RED}Nginx 설정 검증 실패! 롤백합니다.${NC}"
    exit 1
fi

# 이전 컨테이너 중지 (초기 배포가 아닌 경우)
if [ "$CURRENT" != "none" ]; then
    echo -e "${YELLOW}5초 후 [$CURRENT] 컨테이너를 중지합니다...${NC}"
    sleep 5
    docker-compose stop $OLD_CONTAINER
    echo -e "${GREEN}[$CURRENT] 컨테이너 중지 완료${NC}"
fi

echo -e "${GREEN}=== 무중단 배포 완료! ===${NC}"
echo -e "${GREEN}현재 활성 환경: $TARGET${NC}"
