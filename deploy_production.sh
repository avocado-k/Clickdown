#!/bin/bash

# Clickdown 프로덕션 배포 스크립트
# Oracle 클라우드 배포용

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Clickdown 프로덕션 배포 스크립트 ===${NC}"
echo ""

# 환경 확인
if [ ! -f "./server/.env.production" ]; then
    echo -e "${RED}❌ .env.production 파일이 없습니다!${NC}"
    echo "1. cp server/.env.production server/.env"
    echo "2. JWT_SECRET을 안전한 값으로 변경"
    echo "3. CORS_ORIGIN을 실제 도메인으로 변경"
    exit 1
fi

# 프로덕션 환경 변수 복사
cp ./server/.env.production ./server/.env
echo -e "${GREEN}✅ 프로덕션 환경 변수 적용됨${NC}"

# 의존성 설치
echo -e "${YELLOW}📦 의존성 설치 중...${NC}"
npm install --production
cd server && npm install --production && cd ..
cd client && npm install --production && cd ..
echo -e "${GREEN}✅ 의존성 설치 완료${NC}"

# 데이터베이스 설정
echo -e "${YELLOW}🗄️ 데이터베이스 설정 중...${NC}"
cd server
npx prisma generate
npx prisma migrate deploy
cd ..
echo -e "${GREEN}✅ 데이터베이스 설정 완료${NC}"

# 클라이언트 빌드
echo -e "${YELLOW}🏗️ 클라이언트 빌드 중...${NC}"
cd client
npm run build
cd ..
echo -e "${GREEN}✅ 클라이언트 빌드 완료${NC}"

# PM2 설치 및 설정
echo -e "${YELLOW}🚀 PM2 설정 중...${NC}"
npm install -g pm2

# PM2 설정 파일 생성
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'clickdown-server',
      script: './server/src/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './server/logs/pm2-error.log',
      out_file: './server/logs/pm2-out.log',
      log_file: './server/logs/pm2-combined.log',
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024'
    },
    {
      name: 'clickdown-client',
      script: 'npm',
      args: 'start',
      cwd: './client',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './client/pm2-error.log',
      out_file: './client/pm2-out.log',
      log_file: './client/pm2-combined.log',
      max_memory_restart: '500M'
    }
  ]
};
EOF

echo -e "${GREEN}✅ PM2 설정 완료${NC}"

# 방화벽 설정
echo -e "${YELLOW}🔥 방화벽 설정 중...${NC}"
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp
sudo ufw reload
echo -e "${GREEN}✅ 방화벽 설정 완료${NC}"

# 서비스 시작
echo -e "${YELLOW}🚀 서비스 시작 중...${NC}"
pm2 start ecosystem.config.js
pm2 startup
pm2 save
echo -e "${GREEN}✅ 서비스 시작 완료${NC}"

# 상태 확인
echo -e "${YELLOW}📊 서비스 상태 확인 중...${NC}"
pm2 status
echo ""

# 로그 확인
echo -e "${YELLOW}📋 최근 로그 확인:${NC}"
pm2 logs --lines 10
echo ""

# 헬스 체크
echo -e "${YELLOW}🔍 헬스 체크 중...${NC}"
sleep 5
curl -s http://localhost:3001/api/health || echo "❌ 서버 헬스 체크 실패"
curl -s http://localhost:3000 > /dev/null && echo "✅ 클라이언트 서버 정상" || echo "❌ 클라이언트 서버 실패"

echo ""
echo -e "${BLUE}=== 배포 완료 ===${NC}"
echo -e "${GREEN}✅ 서버: http://localhost:3001${NC}"
echo -e "${GREEN}✅ 클라이언트: http://localhost:3000${NC}"
echo ""
echo -e "${YELLOW}💡 유용한 명령어:${NC}"
echo "• pm2 status          - 서비스 상태 확인"
echo "• pm2 logs            - 실시간 로그 확인"
echo "• pm2 restart all     - 모든 서비스 재시작"
echo "• pm2 stop all        - 모든 서비스 중지"
echo "• pm2 delete all      - 모든 서비스 삭제"
echo "• pm2 monit           - 모니터링 대시보드"
echo ""
echo -e "${RED}⚠️  중요 사항:${NC}"
echo "1. Oracle 클라우드 보안 그룹에서 포트 3000, 3001 열어주세요"
echo "2. 도메인 DNS를 서버 IP로 설정해주세요"
echo "3. SSL 인증서 설치를 권장합니다 (Let's Encrypt)"
echo "4. 정기적으로 './backup_clickdown.sh' 실행하세요"
echo "5. './monitor_clickdown.sh'로 시스템 상태를 확인하세요"