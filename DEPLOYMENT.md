# 🚀 Clickdown 배포 가이드

## 📋 목차
1. [로컬 개발 환경](#로컬-개발-환경)
2. [Git 저장소 설정](#git-저장소-설정)
3. [Oracle 클라우드 배포](#oracle-클라우드-배포)
4. [Docker 배포](#docker-배포)
5. [보안 설정](#보안-설정)
6. [문제 해결](#문제-해결)

## 🔧 로컬 개발 환경

### 필수 요구사항
- Node.js 18+ 
- npm 9+
- Git
- SQLite3

### 설치 및 실행
```bash
# 1. 저장소 클론
git clone https://github.com/your-username/clickdown.git
cd clickdown

# 2. 의존성 설치
npm run setup

# 3. 환경 변수 설정
cp server/.env.example server/.env
# server/.env 파일 수정

# 4. 데이터베이스 설정
cd server
npx prisma generate
npx prisma migrate dev
cd ..

# 5. 개발 서버 실행
./start.sh
```

## 📂 Git 저장소 설정

### 1. GitHub 저장소 생성
```bash
# 현재 디렉토리에서 실행
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/clickdown.git
git push -u origin main
```

### 2. 중요한 파일들
- `.gitignore` - 민감한 파일 제외
- `server/.env.example` - 환경 변수 템플릿
- `DEPLOYMENT.md` - 배포 가이드

## ☁️ Oracle 클라우드 배포

### 1. Oracle 클라우드 인스턴스 생성
- **OS**: Ubuntu 22.04
- **Shape**: VM.Standard.E2.1.Micro (Free Tier)
- **네트워크**: Public IP 할당
- **포트**: 22, 80, 443, 3000, 3001 열기

### 2. 서버 접속 및 기본 설정
```bash
# SSH 접속
ssh ubuntu@your-server-ip

# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# Node.js 설치
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 기본 도구 설치
sudo apt install -y git sqlite3 curl wget
```

### 3. 자동 배포 스크립트 실행
```bash
# 배포 스크립트 다운로드
wget https://raw.githubusercontent.com/your-username/clickdown/main/deploy_from_git.sh
chmod +x deploy_from_git.sh

# 스크립트 내 저장소 URL 수정
sed -i 's|your-username|실제-사용자명|g' deploy_from_git.sh

# 배포 실행
sudo ./deploy_from_git.sh main
```

### 4. 보안 강화
```bash
# 보안 설정 스크립트 실행
sudo ./security_setup.sh
```

## 🐳 Docker 배포

### 1. Docker 및 Docker Compose 설치
```bash
# Docker 설치
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Docker Compose 설치
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 재로그인 후 확인
docker --version
docker-compose --version
```

### 2. 환경 변수 설정
```bash
# Docker Compose 환경 변수
cp .env.example .env
# .env 파일 수정

# 서버 환경 변수
cp server/.env.example server/.env
# server/.env 파일 수정
```

### 3. 배포 실행
```bash
# Docker Compose로 배포
docker-compose up -d --build

# 상태 확인
docker-compose ps
docker-compose logs -f
```

## 🔒 보안 설정

### 1. 방화벽 설정
```bash
# UFW 활성화
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing

# 필요한 포트만 열기
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3000/tcp  # Client
sudo ufw allow 3001/tcp  # API
```

### 2. SSL 인증서 설정 (Let's Encrypt)
```bash
# Certbot 설치
sudo apt install certbot python3-certbot-nginx

# 인증서 발급
sudo certbot --nginx -d yourdomain.com

# 자동 갱신 설정
sudo crontab -e
# 다음 줄 추가: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. 필수 보안 설정
- JWT_SECRET 변경 (32자 이상)
- 강력한 비밀번호 정책
- 정기적인 백업
- 로그 모니터링

## 📊 모니터링 및 관리

### 1. 서비스 상태 확인
```bash
# PM2 상태
pm2 status
pm2 logs

# Docker 상태
docker-compose ps
docker-compose logs

# 시스템 리소스
./monitor_clickdown.sh
```

### 2. 백업 관리
```bash
# 수동 백업
./backup_clickdown.sh

# 자동 백업 (매일 새벽 2시)
crontab -e
# 추가: 0 2 * * * /opt/clickdown/backup_clickdown.sh
```

### 3. 업데이트 관리
```bash
# 수동 업데이트
sudo /usr/local/bin/update_clickdown.sh

# 자동 업데이트 (6시간마다)
# 이미 크론에 설정됨
```

## 🛠️ 문제 해결

### 1. 일반적인 문제들

**포트 3000/3001 접근 불가**
```bash
# 방화벽 확인
sudo ufw status
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp

# Oracle 클라우드 보안 그룹 확인
# 인바운드 규칙에 포트 3000, 3001 추가
```

**데이터베이스 연결 오류**
```bash
# 권한 확인
ls -la server/prisma/
chmod 660 server/prisma/*.db

# 마이그레이션 재실행
cd server
npx prisma generate
npx prisma migrate deploy
```

**메모리 부족**
```bash
# 스왑 메모리 추가
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 영구 설정
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 2. 로그 확인 방법
```bash
# 애플리케이션 로그
tail -f server/logs/error-*.log
tail -f server/logs/combined-*.log

# 시스템 로그
sudo journalctl -u clickdown -f
tail -f /var/log/clickdown_deploy.log
```

### 3. 서비스 재시작
```bash
# PM2 재시작
pm2 restart all

# Docker 재시작
docker-compose restart

# 시스템 재부팅 후 자동 시작
sudo systemctl enable docker
pm2 startup
pm2 save
```

## 🔧 성능 최적화

### 1. 데이터베이스 최적화
```bash
# 정기적인 VACUUM 실행
echo "0 3 * * 0 sqlite3 /opt/clickdown/server/prisma/prod.db 'VACUUM;'" | sudo crontab -
```

### 2. 로그 관리
```bash
# 로그 로테이션 확인
sudo logrotate -d /etc/logrotate.d/clickdown
```

### 3. 캐시 설정
- Nginx 정적 파일 캐싱
- CDN 사용 (Cloudflare 등)
- Redis 캐시 추가 (선택사항)

## 📞 지원 및 문의

- **GitHub Issues**: https://github.com/your-username/clickdown/issues
- **Documentation**: https://github.com/your-username/clickdown/wiki
- **Email**: your-email@example.com

---

⚠️ **중요**: 프로덕션 환경에서는 반드시 HTTPS를 사용하고, 정기적인 백업과 보안 업데이트를 수행하세요.