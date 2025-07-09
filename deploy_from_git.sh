#!/bin/bash

# Oracle 클라우드에서 Git으로부터 자동 배포 스크립트
# 사용법: ./deploy_from_git.sh [branch_name]

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 변수 설정
BRANCH=${1:-main}
REPO_URL="https://github.com/your-username/clickdown.git"
PROJECT_DIR="/opt/clickdown"
BACKUP_DIR="/opt/clickdown_backup"
LOG_FILE="/var/log/clickdown_deploy.log"

echo -e "${BLUE}=== Clickdown Git 자동 배포 스크립트 ===${NC}"
echo "배포 시작: $(date)" | tee -a $LOG_FILE
echo "브랜치: $BRANCH" | tee -a $LOG_FILE
echo ""

# 루트 권한 확인
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ 루트 권한이 필요합니다. sudo로 실행하세요.${NC}"
    exit 1
fi

# 기존 서비스 중지
echo -e "${YELLOW}🛑 기존 서비스 중지 중...${NC}"
pm2 stop all 2>/dev/null || true
docker-compose down 2>/dev/null || true

# 백업 생성
if [ -d "$PROJECT_DIR" ]; then
    echo -e "${YELLOW}💾 기존 프로젝트 백업 중...${NC}"
    rm -rf $BACKUP_DIR 2>/dev/null || true
    cp -r $PROJECT_DIR $BACKUP_DIR
    echo -e "${GREEN}✅ 백업 완료: $BACKUP_DIR${NC}"
fi

# 프로젝트 디렉토리 생성
mkdir -p $PROJECT_DIR

# Git 클론 또는 풀
if [ -d "$PROJECT_DIR/.git" ]; then
    echo -e "${YELLOW}🔄 Git 저장소 업데이트 중...${NC}"
    cd $PROJECT_DIR
    git fetch origin
    git reset --hard origin/$BRANCH
    git clean -fd
else
    echo -e "${YELLOW}📥 Git 저장소 클론 중...${NC}"
    rm -rf $PROJECT_DIR/*
    cd $PROJECT_DIR
    git clone -b $BRANCH $REPO_URL .
fi

echo -e "${GREEN}✅ Git 저장소 업데이트 완료${NC}"

# 환경 변수 파일 생성
echo -e "${YELLOW}⚙️ 환경 변수 설정 중...${NC}"

# 서버 환경 변수
cat > $PROJECT_DIR/server/.env << EOF
NODE_ENV=production
DATABASE_URL=file:./prod.db
JWT_SECRET=$(openssl rand -hex 32)
JWT_EXPIRES_IN=24h
PORT=3001
CORS_ORIGIN=https://$(curl -s ifconfig.me)
LOG_LEVEL=info
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
LOGIN_RATE_LIMIT_MAX=5
REGISTER_RATE_LIMIT_MAX=3
EOF

# Docker Compose 환경 변수
cat > $PROJECT_DIR/.env << EOF
JWT_SECRET=$(openssl rand -hex 32)
CORS_ORIGIN=https://$(curl -s ifconfig.me)
EOF

echo -e "${GREEN}✅ 환경 변수 설정 완료${NC}"

# 의존성 설치
echo -e "${YELLOW}📦 의존성 설치 중...${NC}"
cd $PROJECT_DIR
npm install --production 2>&1 | tee -a $LOG_FILE

cd $PROJECT_DIR/server
npm install --production 2>&1 | tee -a $LOG_FILE

cd $PROJECT_DIR/client
npm install --production 2>&1 | tee -a $LOG_FILE

cd $PROJECT_DIR
echo -e "${GREEN}✅ 의존성 설치 완료${NC}"

# 데이터베이스 설정
echo -e "${YELLOW}🗄️ 데이터베이스 설정 중...${NC}"
cd $PROJECT_DIR/server

# 기존 데이터베이스 복원 (있다면)
if [ -f "$BACKUP_DIR/server/prisma/prod.db" ]; then
    echo -e "${YELLOW}📄 기존 데이터베이스 복원 중...${NC}"
    cp $BACKUP_DIR/server/prisma/prod.db ./prisma/prod.db
fi

npx prisma generate 2>&1 | tee -a $LOG_FILE
npx prisma migrate deploy 2>&1 | tee -a $LOG_FILE

echo -e "${GREEN}✅ 데이터베이스 설정 완료${NC}"

# 클라이언트 빌드
echo -e "${YELLOW}🏗️ 클라이언트 빌드 중...${NC}"
cd $PROJECT_DIR/client
npm run build 2>&1 | tee -a $LOG_FILE
echo -e "${GREEN}✅ 클라이언트 빌드 완료${NC}"

# 파일 권한 설정
echo -e "${YELLOW}🔐 파일 권한 설정 중...${NC}"
cd $PROJECT_DIR
chown -R ubuntu:ubuntu $PROJECT_DIR
chmod +x *.sh
chmod 600 server/.env
chmod 600 .env
chmod 700 server/logs 2>/dev/null || mkdir -p server/logs && chmod 700 server/logs
echo -e "${GREEN}✅ 파일 권한 설정 완료${NC}"

# 배포 방법 선택
echo -e "${YELLOW}🚀 배포 방법을 선택하세요:${NC}"
echo "1) Docker Compose (권장)"
echo "2) PM2 직접 실행"
echo "3) 둘 다 설정"
read -p "선택 (1-3): " DEPLOY_METHOD

case $DEPLOY_METHOD in
    1)
        echo -e "${YELLOW}🐳 Docker Compose로 배포 중...${NC}"
        docker-compose up -d --build 2>&1 | tee -a $LOG_FILE
        ;;
    2)
        echo -e "${YELLOW}🔧 PM2로 배포 중...${NC}"
        sudo -u ubuntu pm2 start ecosystem.config.js 2>&1 | tee -a $LOG_FILE
        sudo -u ubuntu pm2 startup
        sudo -u ubuntu pm2 save
        ;;
    3)
        echo -e "${YELLOW}🔧 PM2 설정 중...${NC}"
        sudo -u ubuntu pm2 start ecosystem.config.js 2>&1 | tee -a $LOG_FILE
        sudo -u ubuntu pm2 startup
        sudo -u ubuntu pm2 save
        echo -e "${YELLOW}🐳 Docker Compose 설정 중...${NC}"
        docker-compose up -d --build 2>&1 | tee -a $LOG_FILE
        ;;
    *)
        echo -e "${RED}❌ 잘못된 선택입니다.${NC}"
        exit 1
        ;;
esac

# 서비스 상태 확인
echo -e "${YELLOW}📊 서비스 상태 확인 중...${NC}"
sleep 10

# 헬스 체크
echo -e "${YELLOW}🔍 헬스 체크 중...${NC}"
for i in {1..5}; do
    if curl -s http://localhost:3001/api/health > /dev/null; then
        echo -e "${GREEN}✅ 서버 정상 작동${NC}"
        break
    else
        echo -e "${YELLOW}⏳ 서버 시작 대기 중... ($i/5)${NC}"
        sleep 5
    fi
done

if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✅ 클라이언트 정상 작동${NC}"
else
    echo -e "${RED}❌ 클라이언트 연결 실패${NC}"
fi

# 방화벽 설정
echo -e "${YELLOW}🔥 방화벽 설정 중...${NC}"
ufw allow 3000/tcp 2>/dev/null || true
ufw allow 3001/tcp 2>/dev/null || true
ufw allow 80/tcp 2>/dev/null || true
ufw allow 443/tcp 2>/dev/null || true
ufw reload 2>/dev/null || true

# 로그 순환 설정
echo -e "${YELLOW}📊 로그 순환 설정 중...${NC}"
cat > /etc/logrotate.d/clickdown << 'LOGROTATE_EOF'
/opt/clickdown/server/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0644 ubuntu ubuntu
    postrotate
        pm2 reload all > /dev/null 2>&1 || true
    endscript
}
LOGROTATE_EOF

# 자동 업데이트 스크립트 생성
echo -e "${YELLOW}🔄 자동 업데이트 스크립트 생성 중...${NC}"
cat > /usr/local/bin/update_clickdown.sh << 'UPDATE_EOF'
#!/bin/bash
cd /opt/clickdown
git fetch origin
if [ $(git rev-parse HEAD) != $(git rev-parse origin/main) ]; then
    echo "업데이트 감지, 배포 시작..."
    /opt/clickdown/deploy_from_git.sh main
    echo "업데이트 완료"
else
    echo "최신 버전입니다."
fi
UPDATE_EOF

chmod +x /usr/local/bin/update_clickdown.sh

# 크론 설정
echo -e "${YELLOW}⏰ 자동 업데이트 크론 설정 중...${NC}"
(crontab -l 2>/dev/null; echo "0 */6 * * * /usr/local/bin/update_clickdown.sh >> /var/log/clickdown_auto_update.log 2>&1") | crontab -

echo ""
echo -e "${BLUE}=== 배포 완료 ===${NC}"
echo "배포 완료: $(date)" | tee -a $LOG_FILE
echo -e "${GREEN}✅ 서버: http://$(curl -s ifconfig.me):3001${NC}"
echo -e "${GREEN}✅ 클라이언트: http://$(curl -s ifconfig.me):3000${NC}"
echo ""
echo -e "${YELLOW}💡 유용한 명령어:${NC}"
echo "• pm2 status                    - PM2 서비스 상태"
echo "• docker-compose ps             - Docker 컨테이너 상태"
echo "• docker-compose logs -f        - Docker 실시간 로그"
echo "• /usr/local/bin/update_clickdown.sh - 수동 업데이트"
echo "• tail -f $LOG_FILE             - 배포 로그 확인"
echo ""
echo -e "${YELLOW}🔧 관리 팁:${NC}"
echo "• 자동 업데이트: 6시간마다 실행됨"
echo "• 로그 위치: $PROJECT_DIR/server/logs/"
echo "• 백업 위치: $BACKUP_DIR"
echo "• 데이터베이스: $PROJECT_DIR/server/prisma/prod.db"
echo ""
echo -e "${RED}⚠️  보안 설정:${NC}"
echo "1. Oracle 클라우드 보안 그룹에서 포트 80, 443, 3000, 3001 열기"
echo "2. SSL 인증서 설정 (Let's Encrypt 권장)"
echo "3. 도메인 DNS 설정"
echo "4. 방화벽 설정 확인"