// JWT 토큰 생성과 비밀번호 암호화를 위한 라이브러리들
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// JWT 토큰 생성 함수
// userId를 받아서 JWT 토큰을 생성합니다
const generateToken = (userId) => {
  // jwt.sign: 페이로드(userId), 비밀키, 옵션을 받아서 토큰을 생성
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d' // 토큰 만료 시간 (기본 7일)
  });
};

// 비밀번호 해시화 함수 (암호화)
// 원본 비밀번호를 받아서 해시된 비밀번호를 반환
const hashPassword = async (password) => {
  // bcrypt.hash: 비밀번호와 salt 라운드(12)를 사용해 해시 생성
  // 숫자가 클수록 더 안전하지만 처리 시간이 오래 걸림
  return await bcrypt.hash(password, 12);
};

// 비밀번호 비교 함수
// 사용자가 입력한 비밀번호와 저장된 해시된 비밀번호를 비교
const comparePasswords = async (password, hashedPassword) => {
  // bcrypt.compare: 원본 비밀번호와 해시된 비밀번호를 비교해서 true/false 반환
  return await bcrypt.compare(password, hashedPassword);
};

// CommonJS 모듈 시스템으로 함수들을 내보냄
// 다른 파일에서 require()로 가져다 사용할 수 있게 함
module.exports = {
  generateToken,
  hashPassword,
  comparePasswords
};