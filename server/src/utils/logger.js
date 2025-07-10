// 로깅 라이브러리들
const winston = require('winston'); // 로깅 라이브러리
const DailyRotateFile = require('winston-daily-rotate-file'); // 날짜별 로그 파일 회전
const path = require('path'); // 파일 경로 처리
const fs = require('fs'); // 파일 시스템 접근

// 로그 디렉토리 생성
// __dirname: 현재 파일이 있는 디렉토리의 절대 경로
const logDir = path.join(__dirname, '../../logs');
// fs.existsSync: 파일/디렉토리가 존재하는지 동기적으로 확인
if (!fs.existsSync(logDir)) {
  // recursive: true -> 중간 디렉토리가 없어도 모두 생성
  fs.mkdirSync(logDir, { recursive: true });
}

// 로그 포맷 설정
// winston.format.combine: 여러 포맷을 결합하여 사용
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // 타임스탬프 추가
  winston.format.errors({ stack: true }), // 에러 스택 트레이스 포함
  winston.format.json() // JSON 형태로 출력
);

// 콘솔 로그 포맷 (개발 환경에서 보기 좋게)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(), // 로그 레벨에 따라 색상 추가
  winston.format.errors({ stack: true }),
  // printf: 커스텀 포맷 함수 정의
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (stack) {
      log += `\n${stack}`; // 에러 스택이 있으면 추가
    }
    // Object.keys: 객체의 키들을 배열로 반환
    if (Object.keys(meta).length > 0) {
      // JSON.stringify: 객체를 JSON 문자열로 변환 (null, 2는 들여쓰기 옵션)
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    return log;
  })
);

// 로거 생성
// winston.createLogger: 로거 인스턴스를 생성
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info', // 환경변수에서 로그 레벨 설정 (기본값: info)
  format: logFormat, // 위에서 정의한 로그 포맷 사용
  transports: [ // transports: 로그를 어디로 보낼지 정의하는 배열
    // 에러 로그 (에러만)
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'), // %DATE%는 날짜로 치환됨
      datePattern: 'YYYY-MM-DD', // 날짜 패턴 정의
      level: 'error', // 에러 레벨만 기록
      maxSize: '20m', // 파일 최대 크기 20MB
      maxFiles: '14d', // 14일간 보관
      zippedArchive: true // 오래된 로그 파일 압축
    }),
    
    // 일반 로그 (모든 레벨)
    new DailyRotateFile({
      filename: path.join(logDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true
    }),
    
    // API 요청 로그
    new DailyRotateFile({
      filename: path.join(logDir, 'api-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'info',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format.label({ label: 'API' }) // API 라벨 추가
      )
    })
  ]
});

// 개발 환경에서는 콘솔 로그도 표시
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// 프로덕션 환경에서는 더 간단한 콘솔 로그
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.Console({
    level: 'warn',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.simple()
    )
  }));
}

// 로그 레벨별 헬퍼 함수
const log = {
  error: (message, meta = {}) => {
    logger.error(message, meta);
  },
  warn: (message, meta = {}) => {
    logger.warn(message, meta);
  },
  info: (message, meta = {}) => {
    logger.info(message, meta);
  },
  debug: (message, meta = {}) => {
    logger.debug(message, meta);
  },
  
  // API 요청 로그
  apiRequest: (req, res, responseTime) => {
    const logData = {
      method: req.method,
      url: req.url,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      userId: req.user ? req.user.id : null,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    };
    
    logger.info('API Request', logData);
  },
  
  // 인증 로그
  auth: (action, userId, details = {}) => {
    logger.info(`Auth: ${action}`, {
      userId,
      action,
      ...details,
      timestamp: new Date().toISOString()
    });
  },
  
  // 데이터베이스 쿼리 로그
  database: (query, duration, error = null) => {
    const logData = {
      query: query.substring(0, 200), // 긴 쿼리는 자르기
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    };
    
    if (error) {
      logger.error('Database Error', { ...logData, error: error.message });
    } else {
      logger.debug('Database Query', logData);
    }
  }
};

module.exports = log;