#!/bin/bash

# Clickdown 사용자 삭제 스크립트
# 사용법: ./user_delete.sh

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 데이터베이스 파일 경로
DB_PATH="./server/prisma/dev.db"

# 스크립트 시작
echo -e "${BLUE}=== Clickdown 사용자 삭제 도구 ===${NC}"
echo ""

# 데이터베이스 파일 존재 확인
if [ ! -f "$DB_PATH" ]; then
    echo -e "${RED}❌ 데이터베이스 파일을 찾을 수 없습니다: $DB_PATH${NC}"
    echo -e "${YELLOW}💡 Clickdown 프로젝트 루트 디렉토리에서 실행해주세요.${NC}"
    exit 1
fi

# SQLite 설치 확인
if ! command -v sqlite3 &> /dev/null; then
    echo -e "${RED}❌ SQLite3가 설치되지 않았습니다.${NC}"
    echo -e "${YELLOW}💡 설치 방법:${NC}"
    echo "  Ubuntu/Debian: sudo apt-get install sqlite3"
    echo "  macOS: brew install sqlite3"
    echo "  Windows: SQLite 공식 사이트에서 다운로드"
    exit 1
fi

# 현재 사용자 목록 표시
echo -e "${BLUE}📋 현재 등록된 사용자 목록:${NC}"
echo ""
sqlite3 "$DB_PATH" "SELECT '이메일: ' || email || ' | 사용자명: ' || username || ' | 가입일: ' || date(createdAt) FROM User ORDER BY createdAt DESC;" 2>/dev/null

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 데이터베이스 연결에 실패했습니다.${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}⚠️  경고: 사용자를 삭제하면 관련된 모든 데이터가 영구적으로 삭제됩니다!${NC}"
echo -e "${YELLOW}   (워크스페이스, 프로젝트, 태스크, 댓글 등)${NC}"
echo ""

# 이메일 입력 받기
while true; do
    echo -e "${BLUE}삭제할 사용자의 이메일을 입력하세요:${NC}"
    read -r email
    
    if [ -z "$email" ]; then
        echo -e "${RED}❌ 이메일을 입력해주세요.${NC}"
        continue
    fi
    
    # 이메일 형식 간단 검증
    if [[ ! "$email" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        echo -e "${RED}❌ 올바른 이메일 형식을 입력해주세요.${NC}"
        continue
    fi
    
    break
done

# 사용자 존재 확인
user_exists=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM User WHERE email = '$email';" 2>/dev/null)

if [ "$user_exists" -eq 0 ]; then
    echo -e "${RED}❌ 해당 이메일의 사용자를 찾을 수 없습니다: $email${NC}"
    exit 1
fi

# 사용자 정보 표시
echo ""
echo -e "${BLUE}🔍 삭제할 사용자 정보:${NC}"
sqlite3 "$DB_PATH" "SELECT '이메일: ' || email || '\n사용자명: ' || username || '\n가입일: ' || datetime(createdAt, 'localtime') FROM User WHERE email = '$email';"

# 관련 데이터 개수 확인
echo ""
echo -e "${BLUE}📊 관련 데이터 개수:${NC}"

# 워크스페이스 개수
workspace_count=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM Workspace WHERE ownerId = (SELECT id FROM User WHERE email = '$email');" 2>/dev/null)
echo "• 소유 워크스페이스: $workspace_count개"

# 프로젝트 개수 (사용자가 소유한 워크스페이스의 프로젝트들)
project_count=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM Project WHERE workspaceId IN (SELECT id FROM Workspace WHERE ownerId = (SELECT id FROM User WHERE email = '$email'));" 2>/dev/null)
echo "• 관련 프로젝트: $project_count개"

# 태스크 개수
task_count=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM Task WHERE assigneeId = (SELECT id FROM User WHERE email = '$email') OR projectId IN (SELECT id FROM Project WHERE workspaceId IN (SELECT id FROM Workspace WHERE ownerId = (SELECT id FROM User WHERE email = '$email')));" 2>/dev/null)
echo "• 관련 태스크: $task_count개"

echo ""

# 최종 확인
echo -e "${YELLOW}⚠️  정말로 이 사용자를 삭제하시겠습니까?${NC}"
echo -e "${YELLOW}   모든 관련 데이터가 영구적으로 삭제됩니다!${NC}"
echo ""
echo -e "${RED}삭제하려면 'DELETE'를 정확히 입력하세요:${NC}"
read -r confirmation

if [ "$confirmation" != "DELETE" ]; then
    echo -e "${GREEN}✅ 삭제가 취소되었습니다.${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}🔄 사용자 삭제 중...${NC}"

# 백업 생성
backup_file="./server/prisma/backup_$(date +%Y%m%d_%H%M%S).db"
cp "$DB_PATH" "$backup_file"
echo -e "${GREEN}💾 백업 생성됨: $backup_file${NC}"

# 사용자 삭제 (CASCADE로 관련 데이터 자동 삭제)
delete_result=$(sqlite3 "$DB_PATH" "DELETE FROM User WHERE email = '$email';" 2>&1)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 사용자가 성공적으로 삭제되었습니다.${NC}"
    echo -e "${GREEN}📧 삭제된 사용자: $email${NC}"
    echo -e "${GREEN}💾 백업 파일: $backup_file${NC}"
    echo ""
    echo -e "${YELLOW}💡 참고: 서버를 재시작하여 변경사항을 반영해주세요.${NC}"
else
    echo -e "${RED}❌ 사용자 삭제 중 오류 발생:${NC}"
    echo "$delete_result"
    echo -e "${GREEN}💾 백업 파일이 생성되었습니다: $backup_file${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}=== 삭제 완료 ===${NC}"