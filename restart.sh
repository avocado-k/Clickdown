#!/bin/bash

# Clickdown 재시작 스크립트

echo "🔄 Restarting Clickdown..."
echo "=============================="

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 중지
echo -e "${YELLOW}🛑 Stopping current processes...${NC}"
./stop.sh

echo ""
echo -e "${YELLOW}⏳ Waiting 3 seconds...${NC}"
sleep 3

# 시작
echo -e "${BLUE}🚀 Starting Clickdown...${NC}"
./start.sh $@

echo ""
echo -e "${GREEN}🎉 Clickdown restarted!${NC}"