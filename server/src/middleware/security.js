const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const log = require('../utils/logger');

// Rate Limiting 설정
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      log.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method
      });
      res.status(429).json({ message });
    }
  });
};

// 일반 API 요청 제한
const generalLimiter = createRateLimiter(
  15 * 60 * 1000, // 15분
  500, // 500 요청 (개발 환경에서 더 관대하게)
  'Too many requests from this IP, please try again later.'
);

// 로그인 요청 제한
const loginLimiter = createRateLimiter(
  15 * 60 * 1000, // 15분
  5, // 5 요청
  'Too many login attempts from this IP, please try again after 15 minutes.'
);

// 회원가입 요청 제한
const registerLimiter = createRateLimiter(
  60 * 60 * 1000, // 1시간
  3, // 3 요청
  'Too many registration attempts from this IP, please try again after an hour.'
);

// 입력 검증 미들웨어
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required')
    .isLength({ max: 255 })
    .withMessage('Email too long'),
  body('password')
    .isLength({ min: 6, max: 100 })
    .withMessage('Password must be between 6 and 100 characters')
    .matches(/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/)
    .withMessage('Password contains invalid characters'),
];

const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required')
    .isLength({ max: 255 })
    .withMessage('Email too long'),
  body('username')
    .isLength({ min: 2, max: 50 })
    .withMessage('Username must be between 2 and 50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),
  body('password')
    .isLength({ min: 6, max: 100 })
    .withMessage('Password must be between 6 and 100 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
];

const validateTask = [
  body('title')
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters')
    .trim()
    .escape(),
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Description must be less than 2000 characters')
    .trim()
    .escape(),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be one of: low, medium, high, urgent'),
  body('status')
    .optional()
    .isIn(['todo', 'in_progress', 'review', 'done'])
    .withMessage('Status must be one of: todo, in_progress, review, done'),
];

const validateProject = [
  body('name')
    .isLength({ min: 1, max: 255 })
    .withMessage('Project name must be between 1 and 255 characters')
    .trim()
    .escape(),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters')
    .trim()
    .escape(),
  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color must be a valid hex color'),
];

// 검증 에러 처리
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    log.warn('Validation errors', {
      errors: errors.array(),
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method
    });
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// 보안 헤더 설정
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

// 의심스러운 요청 감지
const detectSuspiciousActivity = (req, res, next) => {
  const suspiciousPatterns = [
    /\.\./,  // Path traversal
    /<script/i,  // XSS
    /union.*select/i,  // SQL injection
    /javascript:/i,  // JavaScript protocol
    /vbscript:/i,  // VBScript protocol
    /onload=/i,  // Event handlers
    /onclick=/i,
    /onerror=/i,
  ];

  const checkString = req.url + JSON.stringify(req.body) + JSON.stringify(req.query);
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(checkString)) {
      log.warn('Suspicious activity detected', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
        body: req.body,
        query: req.query,
        pattern: pattern.toString()
      });
      return res.status(400).json({ message: 'Suspicious request detected' });
    }
  }
  
  next();
};

// IP 화이트리스트 (선택적 사용)
const ipWhitelist = (allowedIPs) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (allowedIPs && allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
      log.warn('IP not in whitelist', {
        ip: clientIP,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method
      });
      return res.status(403).json({ message: 'Access denied' });
    }
    
    next();
  };
};

module.exports = {
  generalLimiter,
  loginLimiter,
  registerLimiter,
  validateLogin,
  validateRegister,
  validateTask,
  validateProject,
  handleValidationErrors,
  securityHeaders,
  detectSuspiciousActivity,
  ipWhitelist
};