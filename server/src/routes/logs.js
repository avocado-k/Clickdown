const express = require('express');
const log = require('../utils/logger');

const router = express.Router();

// 클라이언트 로그 수신 엔드포인트
router.post('/', async (req, res) => {
  try {
    const { logs } = req.body;

    if (!logs || !Array.isArray(logs)) {
      return res.status(400).json({ message: 'Invalid logs format' });
    }

    // 각 로그를 서버 로그로 기록
    logs.forEach(clientLog => {
      const logData = {
        clientLog: true,
        ...clientLog,
        serverTimestamp: new Date().toISOString()
      };

      switch (clientLog.level) {
        case 'error':
          log.error(`Client Error: ${clientLog.message}`, logData);
          break;
        case 'warn':
          log.warn(`Client Warning: ${clientLog.message}`, logData);
          break;
        case 'info':
          log.info(`Client Info: ${clientLog.message}`, logData);
          break;
        case 'debug':
          log.debug(`Client Debug: ${clientLog.message}`, logData);
          break;
        default:
          log.info(`Client Log: ${clientLog.message}`, logData);
      }
    });

    res.json({ message: 'Logs received successfully' });
  } catch (error) {
    log.error('Error processing client logs', {
      error: error.message,
      stack: error.stack,
      body: req.body
    });
    res.status(500).json({ message: 'Error processing logs' });
  }
});

module.exports = router;