const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Settings = require('../models/Settings');
const { generateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user with email and password
 */
router.post(
  '/register',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('firstName')
      .optional()
      .trim()
      .escape(),
    body('lastName')
      .optional()
      .trim()
      .escape()
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, firstName = '', lastName = '' } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({
          error: 'User already exists',
          message: 'An account with this email already exists'
        });
      }

      // Create new user
      const user = new User({
        email,
        password,
        firstName,
        lastName
      });

      await user.save();

      // Create default settings for user
      const settings = new Settings({
        userId: user._id.toString()
      });

      await settings.save();

      // Generate token
      const token = generateToken(user._id.toString(), user.email);

      logger.info(`User registered: ${email}`);

      res.status(201).json({
        message: 'Registration successful',
        user: user.toJSON(),
        token
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({
        error: 'Registration failed',
        message: error.message
      });
    }
  }
);

/**
 * POST /api/auth/login
 * Authenticate user with email and password
 */
router.post(
  '/login',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user and select password field
      const user = await User.findOne({ email }).select('+password');

      if (!user) {
        logger.warn(`Failed login attempt - user not found: ${email}`);
        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'Email or password is incorrect'
        });
      }

      // Check if account is locked
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        logger.warn(`Login attempt on locked account: ${email}`);
        return res.status(429).json({
          error: 'Account temporarily locked',
          message: 'Too many failed attempts. Please try again later.'
        });
      }

      // Compare passwords
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        // Increment failed attempts
        user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

        // Lock account after 5 failed attempts (30 minutes)
        if (user.failedLoginAttempts >= 5) {
          user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
          logger.warn(`Account locked due to failed attempts: ${email}`);
        }

        await user.save();

        logger.warn(`Failed login attempt - wrong password: ${email}`);
        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'Email or password is incorrect'
        });
      }

      // Reset failed attempts and lock on successful login
      user.failedLoginAttempts = 0;
      user.lockedUntil = null;
      user.lastLogin = new Date();

      await user.save();

      // Generate token
      const token = generateToken(user._id.toString(), user.email);

      logger.info(`User logged in: ${email}`);

      res.json({
        message: 'Login successful',
        user: user.toJSON(),
        token
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        error: 'Login failed',
        message: error.message
      });
    }
  }
);

/**
 * POST /api/auth/validate
 * Validate current JWT token
 */
router.post('/validate', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        valid: false,
        message: 'No token provided'
      });
    }

    const token = authHeader.substring(7);
    const { generateToken: gen, verifyToken } = require('../middleware/auth');

    // This will throw if invalid
    const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);

    res.json({
      valid: true,
      user: {
        userId: decoded.userId,
        email: decoded.email
      }
    });
  } catch (error) {
    logger.error('Token validation error:', error);
    res.status(401).json({
      valid: false,
      message: 'Invalid token'
    });
  }
});

module.exports = router;
