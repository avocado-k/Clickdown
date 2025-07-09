const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// 로그 디렉토리 생성
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 로그 포맷 설정
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// 콘솔 로그 포맷
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (stack) {
      log += `\n${stack}`;
    }
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    return log;
  })
);

// 로거 생성
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // 에러 로그 (에러만)
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true
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
        winston.format.label({ label: 'API' })
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