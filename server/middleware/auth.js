const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * Middleware to verify JWT token
 * Extracts and validates token from Authorization header
 */
const verifyToken = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'No token provided',
        message: 'Authorization header with Bearer token required'
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user info to request
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      logger.error('Token expired:', error.message);
      return res.status(401).json({
        error: 'Token expired',
        message: 'Please log in again'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      logger.error('Invalid token:', error.message);
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Token is malformed or invalid'
      });
    }
    
    logger.error('Token verification error:', error);
    res.status(401).json({
      error: 'Authentication failed',
      message: 'Unable to verify token'
    });
  }
};

/**
 * Middleware to generate JWT token
 * Called after successful login/registration
 */
const generateToken = (userId, email) => {
  try {
    const token = jwt.sign(
      {
        userId,
        email
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '24h', // Token valid for 24 hours
        issuer: 'vocalflow-api',
        subject: userId
      }
    );
    
    return token;
  } catch (error) {
    logger.error('Token generation error:', error);
    throw error;
  }
};

module.exports = {
  verifyToken,
  generateToken
};
