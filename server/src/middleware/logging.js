const log = require('../utils/logger');

// API 요청 로깅 미들웨어
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // 응답이 완료되었을 때 로그 기록
  const originalSend = res.send;
  res.send = function(body) {
    const responseTime = Date.now() - start;
    log.apiRequest(req, res, responseTime);
    return originalSend.call(this, body);
  };
  
  next();
};

// 에러 로깅 미들웨어
const errorLogger = (err, req, res, next) => {
  const errorData = {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user ? req.user.id : null,
    body: req.body,
    params: req.params,
    query: req.query,
    timestamp: new Date().toISOString()
  };
  
  log.error('Server Error', errorData);
  next(err);
};

module.exports = {
  requestLogger,
  errorLogger
};