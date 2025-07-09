#!/bin/bash

# Clickdown 서버 중지 스크립트
# 서버와 클라이언트를 동시에 종료합니다

echo "🛑 Stopping Clickdown..."
echo "=============================="

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# PID 파일 디렉토리 확인
if [ ! -d ".pids" ]; then
    echo -e "${YELLOW}⚠️  No PID files found${NC}"
fi

# 저장된 PID로 프로세스 종료
if [ -f ".pids/server.pid" ]; then
    SERVER_PID=$(cat .pids/server.pid)
    echo -e "${BLUE}🖥️  Stopping server (PID: $SERVER_PID)...${NC}"
    
    if ps -p $SERVER_PID > /dev/null; then
        kill $SERVER_PID 2>/dev/null
        sleep 2
        
        # 강제 종료가 필요한 경우
        if ps -p $SERVER_PID > /dev/null; then
            echo -e "${YELLOW}⚠️  Force killing server...${NC}"
            kill -9 $SERVER_PID 2>/dev/null
        fi
        
        echo -e "${GREEN}✅ Server stopped${NC}"
    else
        echo -e "${YELLOW}⚠️  Server process not found${NC}"
    fi
    
    rm -f .pids/server.pid
fi

if [ -f ".pids/client.pid" ]; then
    CLIENT_PID=$(cat .pids/client.pid)
    echo -e "${BLUE}🌐 Stopping client (PID: $CLIENT_PID)...${NC}"
    
    if ps -p $CLIENT_PID > /dev/null; then
        kill $CLIENT_PID 2>/dev/null
        sleep 2
        
        # 강제 종료가 필요한 경우
        if ps -p $CLIENT_PID > /dev/null; then
            echo -e "${YELLOW}⚠️  Force killing client...${NC}"
            kill -9 $CLIENT_PID 2>/dev/null
        fi
        
        echo -e "${GREEN}✅ Client stopped${NC}"
    else
        echo -e "${YELLOW}⚠️  Client process not found${NC}"
    fi
    
    rm -f .pids/client.pid
fi

# 포트 기반으로 프로세스 찾아서 종료 (추가 안전장치)
echo -e "${BLUE}🔍 Checking for remaining processes...${NC}"

# 포트 3001 (서버) 사용 프로세스 종료
SERVER_PORTS=$(lsof -ti:3001 2>/dev/null || true)
if [ ! -z "$SERVER_PORTS" ]; then
    echo -e "${YELLOW}⚠️  Found processes on port 3001, killing...${NC}"
    kill -9 $SERVER_PORTS 2>/dev/null || true
fi

# 포트 3000 (클라이언트) 사용 프로세스 종료
CLIENT_PORTS=$(lsof -ti:3000 2>/dev/null || true)
if [ ! -z "$CLIENT_PORTS" ]; then
    echo -e "${YELLOW}⚠️  Found processes on port 3000, killing...${NC}"
    kill -9 $CLIENT_PORTS 2>/dev/null || true
fi

# Node.js 프로세스 중에서 clickdown 관련 프로세스 찾아서 종료
CLICKDOWN_PROCESSES=$(ps aux | grep -E "(clickdown|nodemon|next)" | grep -v grep | awk '{print $2}' || true)
if [ ! -z "$CLICKDOWN_PROCESSES" ]; then
    echo -e "${YELLOW}⚠️  Found remaining clickdown processes, killing...${NC}"
    for pid in $CLICKDOWN_PROCESSES; do
        kill -9 $pid 2>/dev/null || true
    done
fi

# PID 디렉토리 정리
rm -rf .pids

echo ""
echo -e "${GREEN}✅ Clickdown stopped successfully${NC}"
echo "=============================="

# 프로세스 상태 확인
echo -e "${BLUE}🔍 Final process check:${NC}"
REMAINING_3001=$(lsof -ti:3001 2>/dev/null || true)
REMAINING_3000=$(lsof -ti:3000 2>/dev/null || true)

if [ -z "$REMAINING_3001" ] && [ -z "$REMAINING_3000" ]; then
    echo -e "${GREEN}✅ All processes stopped successfully${NC}"
else
    echo -e "${RED}⚠️  Some processes may still be running:${NC}"
    [ ! -z "$REMAINING_3001" ] && echo -e "${RED}  - Port 3001: $REMAINING_3001${NC}"
    [ ! -z "$REMAINING_3000" ] && echo -e "${RED}  - Port 3000: $REMAINING_3000${NC}"
fi

echo ""
echo -e "${YELLOW}💡 To start again: ./start.sh${NC}"