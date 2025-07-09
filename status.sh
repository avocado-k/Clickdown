#!/bin/bash

# Clickdown 상태 확인 스크립트

echo "📊 Clickdown Status"
echo "=============================="

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# PID 파일 확인
if [ -f ".pids/server.pid" ]; then
    SERVER_PID=$(cat .pids/server.pid)
    if ps -p $SERVER_PID > /dev/null; then
        echo -e "${GREEN}✅ Server: Running (PID: $SERVER_PID)${NC}"
        SERVER_STATUS="running"
    else
        echo -e "${RED}❌ Server: Not running (stale PID file)${NC}"
        SERVER_STATUS="stopped"
        rm -f .pids/server.pid
    fi
else
    echo -e "${RED}❌ Server: Not running${NC}"
    SERVER_STATUS="stopped"
fi

if [ -f ".pids/client.pid" ]; then
    CLIENT_PID=$(cat .pids/client.pid)
    if ps -p $CLIENT_PID > /dev/null; then
        echo -e "${GREEN}✅ Client: Running (PID: $CLIENT_PID)${NC}"
        CLIENT_STATUS="running"
    else
        echo -e "${RED}❌ Client: Not running (stale PID file)${NC}"
        CLIENT_STATUS="stopped"
        rm -f .pids/client.pid
    fi
else
    echo -e "${RED}❌ Client: Not running${NC}"
    CLIENT_STATUS="stopped"
fi

echo ""
echo -e "${BLUE}🔍 Port Status:${NC}"

# 포트 3001 (서버) 확인
if lsof -ti:3001 >/dev/null 2>&1; then
    PORT_3001_PID=$(lsof -ti:3001)
    echo -e "${GREEN}✅ Port 3001: In use (PID: $PORT_3001_PID)${NC}"
else
    echo -e "${RED}❌ Port 3001: Available${NC}"
fi

# 포트 3000 (클라이언트) 확인
if lsof -ti:3000 >/dev/null 2>&1; then
    PORT_3000_PID=$(lsof -ti:3000)
    echo -e "${GREEN}✅ Port 3000: In use (PID: $PORT_3000_PID)${NC}"
else
    echo -e "${RED}❌ Port 3000: Available${NC}"
fi

echo ""
echo -e "${BLUE}🌐 URLs:${NC}"
echo -e "  Frontend: http://localhost:3000"
echo -e "  Backend:  http://localhost:3001"
echo -e "  Health:   http://localhost:3001/api/health"

echo ""
echo -e "${BLUE}📝 Log Files:${NC}"
if [ -f "logs/server.log" ]; then
    SERVER_LOG_SIZE=$(du -h logs/server.log | cut -f1)
    echo -e "${GREEN}✅ Server log: logs/server.log ($SERVER_LOG_SIZE)${NC}"
else
    echo -e "${YELLOW}⚠️  Server log: Not found${NC}"
fi

if [ -f "logs/client.log" ]; then
    CLIENT_LOG_SIZE=$(du -h logs/client.log | cut -f1)
    echo -e "${GREEN}✅ Client log: logs/client.log ($CLIENT_LOG_SIZE)${NC}"
else
    echo -e "${YELLOW}⚠️  Client log: Not found${NC}"
fi

# 데이터베이스 상태
echo ""
echo -e "${BLUE}🗄️  Database:${NC}"
if [ -f "server/dev.db" ]; then
    DB_SIZE=$(du -h server/dev.db | cut -f1)
    echo -e "${GREEN}✅ SQLite database: server/dev.db ($DB_SIZE)${NC}"
else
    echo -e "${RED}❌ Database: Not found${NC}"
fi

# 전체 상태 요약
echo ""
echo -e "${BLUE}📊 Overall Status:${NC}"
if [ "$SERVER_STATUS" = "running" ] && [ "$CLIENT_STATUS" = "running" ]; then
    echo -e "${GREEN}✅ Clickdown is fully operational${NC}"
elif [ "$SERVER_STATUS" = "running" ] || [ "$CLIENT_STATUS" = "running" ]; then
    echo -e "${YELLOW}⚠️  Clickdown is partially running${NC}"
else
    echo -e "${RED}❌ Clickdown is not running${NC}"
fi

echo ""
echo -e "${YELLOW}💡 Commands:${NC}"
echo -e "  Start:   ./start.sh"
echo -e "  Stop:    ./stop.sh"
echo -e "  Restart: ./restart.sh"
echo -e "  Logs:    tail -f logs/server.log"
echo -e "          tail -f logs/client.log"

# 간단한 health check
echo ""
echo -e "${BLUE}🔍 Health Check:${NC}"
if curl -s http://localhost:3001/api/health >/dev/null 2>&1; then
    echo -e "${GREEN}✅ API health check: OK${NC}"
else
    echo -e "${RED}❌ API health check: Failed${NC}"
fi