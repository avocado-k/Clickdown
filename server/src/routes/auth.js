const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { hashPassword, comparePasswords, generateToken } = require('../utils/auth');
const authMiddleware = require('../middleware/auth');
const { 
  loginLimiter, 
  registerLimiter, 
  validateLogin, 
  validateRegister, 
  handleValidationErrors 
} = require('../middleware/security');
const log = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

// Register
router.post('/register', registerLimiter, validateRegister, handleValidationErrors, async (req, res) => {
  try {
    const { email, username, password } = req.body;

    log.info('User registration attempt', { email, username, ip: req.ip });

    // Basic validation
    if (!email || !username || !password) {
      log.warn('Registration failed: Missing required fields', { email, username, ip: req.ip });
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password.length < 6) {
      log.warn('Registration failed: Password too short', { email, username, ip: req.ip });
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { username: username }
        ]
      }
    });

    if (existingUser) {
      log.warn('Registration failed: User already exists', { email, username, ip: req.ip });
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword
      },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true
      }
    });

    // Create default workspace
    const workspace = await prisma.workspace.create({
      data: {
        name: `${username}'s Workspace`,
        description: 'Default workspace',
        ownerId: user.id
      }
    });

    // Add user as workspace member
    await prisma.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId: workspace.id,
        role: 'owner'
      }
    });

    // Generate token
    const token = generateToken(user.id);

    log.auth('user_registered', user.id, { email, username, ip: req.ip });

    res.status(201).json({
      message: 'User created successfully',
      user,
      token
    });
  } catch (error) {
    log.error('Registration error', { 
      error: error.message, 
      stack: error.stack, 
      email: req.body.email, 
      username: req.body.username,
      ip: req.ip 
    });
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login
router.post('/login', loginLimiter, validateLogin, handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;

    log.info('User login attempt', { email, ip: req.ip });

    if (!email || !password) {
      log.warn('Login failed: Missing credentials', { email, ip: req.ip });
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      log.warn('Login failed: User not found', { email, ip: req.ip });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await comparePasswords(password, user.password);

    if (!isPasswordValid) {
      log.warn('Login failed: Invalid password', { email, userId: user.id, ip: req.ip });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user.id);

    log.auth('user_logged_in', user.id, { email, ip: req.ip });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      },
      token
    });
  } catch (error) {
    log.error('Login error', { 
      error: error.message, 
      stack: error.stack, 
      email: req.body.email,
      ip: req.ip 
    });
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        createdAt: true
      }
    });

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;