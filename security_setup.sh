#!/bin/bash

# Clickdown 보안 설정 스크립트
# Oracle 클라우드 배포를 위한 보안 강화

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Clickdown 보안 설정 스크립트 ===${NC}"
echo ""

# 1. 방화벽 설정 (UFW)
echo -e "${YELLOW}🔥 방화벽 설정 중...${NC}"
sudo ufw --force enable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3000/tcp  # Next.js (개발용)
sudo ufw allow 3001/tcp  # Express API
echo -e "${GREEN}✅ 방화벽 설정 완료${NC}"

# 2. Fail2ban 설치 및 설정
echo -e "${YELLOW}🛡️ Fail2ban 설치 중...${NC}"
sudo apt-get update
sudo apt-get install -y fail2ban

# SSH 보호 설정
sudo tee /etc/fail2ban/jail.local > /dev/null <<EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[ssh]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 1800

[nginx-req-limit]
enabled = true
filter = nginx-req-limit
action = iptables-multiport[name=ReqLimit, port="http,https", protocol=tcp]
logpath = /var/log/nginx/error.log
findtime = 600
bantime = 7200
maxretry = 10
EOF

sudo systemctl enable fail2ban
sudo systemctl start fail2ban
echo -e "${GREEN}✅ Fail2ban 설정 완료${NC}"

# 3. 자동 보안 업데이트 설정
echo -e "${YELLOW}🔄 자동 보안 업데이트 설정 중...${NC}"
sudo apt-get install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
echo -e "${GREEN}✅ 자동 보안 업데이트 설정 완료${NC}"

# 4. 시스템 보안 강화
echo -e "${YELLOW}🔒 시스템 보안 강화 중...${NC}"

# 불필요한 서비스 비활성화
sudo systemctl disable avahi-daemon 2>/dev/null || true
sudo systemctl disable cups 2>/dev/null || true
sudo systemctl disable bluetooth 2>/dev/null || true

# 커널 파라미터 보안 설정
sudo tee -a /etc/sysctl.conf > /dev/null <<EOF

# 보안 강화 설정
net.ipv4.ip_forward = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.secure_redirects = 0
net.ipv4.conf.default.secure_redirects = 0
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0
net.ipv4.conf.all.log_martians = 1
net.ipv4.conf.default.log_martians = 1
net.ipv4.icmp_echo_ignore_broadcasts = 1
net.ipv4.icmp_ignore_bogus_error_responses = 1
net.ipv4.tcp_syncookies = 1
EOF

sudo sysctl -p
echo -e "${GREEN}✅ 시스템 보안 강화 완료${NC}"

# 5. 파일 권한 설정
echo -e "${YELLOW}📁 파일 권한 설정 중...${NC}"
chmod 600 ./server/.env*
chmod 600 ./server/prisma/*.db 2>/dev/null || true
chmod 700 ./server/logs/ 2>/dev/null || true
chmod +x ./start.sh ./stop.sh ./restart.sh ./status.sh ./user_delete.sh
echo -e "${GREEN}✅ 파일 권한 설정 완료${NC}"

# 6. 로그 순환 설정
echo -e "${YELLOW}📊 로그 순환 설정 중...${NC}"
sudo tee /etc/logrotate.d/clickdown > /dev/null <<EOF
/home/*/Clickdown/server/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0644 $USER $USER
}
EOF
echo -e "${GREEN}✅ 로그 순환 설정 완료${NC}"

# 7. 백업 스크립트 생성
echo -e "${YELLOW}💾 백업 스크립트 생성 중...${NC}"
cat > backup_clickdown.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/backup/clickdown"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# 데이터베이스 백업
cp ./server/prisma/*.db $BACKUP_DIR/db_backup_$DATE.db

# 로그 백업 (압축)
tar -czf $BACKUP_DIR/logs_backup_$DATE.tar.gz ./server/logs/

# 설정 파일 백업
cp ./server/.env* $BACKUP_DIR/env_backup_$DATE 2>/dev/null || true

# 7일 이전 백업 삭제
find $BACKUP_DIR -name "*backup*" -type f -mtime +7 -delete

echo "백업 완료: $BACKUP_DIR"
EOF

chmod +x backup_clickdown.sh
echo -e "${GREEN}✅ 백업 스크립트 생성 완료${NC}"

# 8. 모니터링 스크립트 생성
echo -e "${YELLOW}📈 모니터링 스크립트 생성 중...${NC}"
cat > monitor_clickdown.sh << 'EOF'
#!/bin/bash
echo "=== Clickdown 시스템 모니터링 ==="
echo "시간: $(date)"
echo ""

# 프로세스 상태 확인
echo "🔍 프로세스 상태:"
ps aux | grep -E "(node|npm)" | grep -v grep || echo "Clickdown 프로세스가 실행되지 않음"
echo ""

# 메모리 사용량
echo "💾 메모리 사용량:"
free -h
echo ""

# 디스크 사용량
echo "💿 디스크 사용량:"
df -h
echo ""

# 네트워크 연결 상태
echo "🌐 네트워크 연결 상태:"
ss -tuln | grep -E ":(3000|3001)"
echo ""

# 최근 로그 확인
echo "📋 최근 에러 로그:"
tail -n 5 ./server/logs/error-*.log 2>/dev/null || echo "에러 로그 없음"
echo ""

# 보안 상태 확인
echo "🔒 보안 상태:"
sudo ufw status
echo ""

echo "=== 모니터링 완료 ==="
EOF

chmod +x monitor_clickdown.sh
echo -e "${GREEN}✅ 모니터링 스크립트 생성 완료${NC}"

# 9. 크론탭 설정
echo -e "${YELLOW}⏰ 크론탭 설정 중...${NC}"
(crontab -l 2>/dev/null; echo "0 2 * * * $(pwd)/backup_clickdown.sh") | crontab -
(crontab -l 2>/dev/null; echo "0 */6 * * * $(pwd)/monitor_clickdown.sh >> /var/log/clickdown_monitor.log") | crontab -
echo -e "${GREEN}✅ 크론탭 설정 완료${NC}"

echo ""
echo -e "${BLUE}=== 보안 설정 완료 ===${NC}"
echo -e "${GREEN}✅ 방화벽 설정됨${NC}"
echo -e "${GREEN}✅ Fail2ban 설정됨${NC}"
echo -e "${GREEN}✅ 자동 보안 업데이트 설정됨${NC}"
echo -e "${GREEN}✅ 시스템 보안 강화됨${NC}"
echo -e "${GREEN}✅ 파일 권한 설정됨${NC}"
echo -e "${GREEN}✅ 로그 순환 설정됨${NC}"
echo -e "${GREEN}✅ 백업 및 모니터링 스크립트 생성됨${NC}"
echo -e "${GREEN}✅ 크론탭 설정됨${NC}"
echo ""
echo -e "${YELLOW}💡 다음 단계:${NC}"
echo "1. Oracle 클라우드 보안 그룹에서 포트 80, 443, 3000, 3001 열기"
echo "2. Let's Encrypt SSL 인증서 설치 (선택사항)"
echo "3. 도메인 DNS 설정"
echo "4. 환경 변수 설정: cp .env.production .env"
echo "5. 프로덕션 빌드 실행"
echo ""
echo -e "${RED}⚠️  중요: JWT_SECRET을 반드시 변경하세요!${NC}"