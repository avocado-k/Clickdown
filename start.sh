#!/bin/bash

# Clickdown 서버 시작 스크립트
# 서버와 클라이언트를 동시에 실행합니다

echo "🚀 Starting Clickdown..."
echo "=============================="

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 프로세스 추적용 PID 파일 디렉토리 생성
mkdir -p .pids
mkdir -p logs

# 기존 프로세스 정리
echo -e "${YELLOW}⏹️  Stopping existing processes...${NC}"
if [ -f "./stop.sh" ]; then
    ./stop.sh
else
    echo -e "${YELLOW}⚠️  stop.sh not found, skipping...${NC}"
fi

# 환경 확인
echo -e "${BLUE}🔍 Checking environment...${NC}"

# Node.js 확인
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

# npm 확인
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

# 의존성 확인
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm run setup
fi

# 데이터베이스 확인 및 초기화
echo -e "${BLUE}🗄️  Checking database...${NC}"
cd server
if [ ! -f "dev.db" ]; then
    echo -e "${YELLOW}🔧 Setting up database...${NC}"
    npx prisma generate
    npx prisma migrate dev --name init
else
    echo -e "${GREEN}✅ Database already exists${NC}"
fi
cd ..

# 서버 시작 (백그라운드)
echo -e "${BLUE}🖥️  Starting server...${NC}"
cd server
npm run dev > ../logs/server.log 2>&1 &
SERVER_PID=$!
echo $SERVER_PID > ../.pids/server.pid
cd ..

# 서버 시작 대기
echo -e "${YELLOW}⏳ Waiting for server to start...${NC}"
sleep 3

# 서버 상태 확인
if ps -p $SERVER_PID > /dev/null; then
    echo -e "${GREEN}✅ Server started successfully (PID: $SERVER_PID)${NC}"
else
    echo -e "${RED}❌ Server failed to start${NC}"
    exit 1
fi

# 클라이언트 시작 (백그라운드)
echo -e "${BLUE}🌐 Starting client...${NC}"
cd client
npm run dev > ../logs/client.log 2>&1 &
CLIENT_PID=$!
echo $CLIENT_PID > ../.pids/client.pid
cd ..

# 클라이언트 시작 대기
echo -e "${YELLOW}⏳ Waiting for client to start...${NC}"
sleep 5

# 클라이언트 상태 확인
if ps -p $CLIENT_PID > /dev/null; then
    echo -e "${GREEN}✅ Client started successfully (PID: $CLIENT_PID)${NC}"
else
    echo -e "${RED}❌ Client failed to start${NC}"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

# 로그 디렉토리 생성
mkdir -p logs

echo ""
echo -e "${GREEN}🎉 Clickdown is running!${NC}"
echo "=============================="
echo -e "${BLUE}Frontend:${NC} http://localhost:3000"
echo -e "${BLUE}Backend:${NC}  http://localhost:3001"
echo -e "${BLUE}Logs:${NC}     ./logs/"
echo ""
echo -e "${YELLOW}📋 PIDs:${NC}"
echo -e "  Server: $SERVER_PID"
echo -e "  Client: $CLIENT_PID"
echo ""
echo -e "${YELLOW}🔧 Commands:${NC}"
echo -e "  Stop:    ./stop.sh"
echo -e "  Restart: ./restart.sh"
echo -e "  Status:  ./status.sh"
echo -e "  Logs:    tail -f logs/server.log"
echo -e "          tail -f logs/client.log"
echo ""
echo -e "${BLUE}Press Ctrl+C to stop or run ./stop.sh${NC}"

# 로그 실시간 출력 (옵션)
if [ "$1" = "--logs" ] || [ "$1" = "-l" ]; then
    echo -e "${YELLOW}📝 Showing logs...${NC}"
    tail -f logs/server.log logs/client.log
fi