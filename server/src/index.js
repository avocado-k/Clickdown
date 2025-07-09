const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const log = require('./utils/logger');
const { requestLogger, errorLogger } = require('./middleware/logging');
const { 
  generalLimiter, 
  securityHeaders, 
  detectSuspiciousActivity 
} = require('./middleware/security');

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

log.info('Starting Clickdown server', { 
  port: PORT, 
  nodeEnv: process.env.NODE_ENV,
  timestamp: new Date().toISOString()
});

// Security middleware
app.use(securityHeaders);
app.use(generalLimiter);
app.use(detectSuspiciousActivity);

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/workspaces', require('./routes/workspaces'));
app.use('/api/logs', require('./routes/logs'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(errorLogger);
app.use((err, req, res, next) => {
  log.error('Unhandled server error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  log.info(`Server started successfully on port ${PORT}`);
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  log.info('Received SIGTERM, shutting down gracefully');
  await prisma.$disconnect();
  log.info('Database connection closed');
  process.exit(0);
});

process.on('SIGINT', async () => {
  log.info('Received SIGINT, shutting down gracefully');
  await prisma.$disconnect();
  log.info('Database connection closed');
  process.exit(0);
});

module.exports = app;