const logger = require('../utils/logger');

/**
 * Request validation error handler
 * Formats express-validator errors nicely
 */
const validationErrorHandler = (req, res, next) => {
  // Check if this middleware should run (errors are in req object)
  if (!req.errors || req.errors.length === 0) {
    return next();
  }

  const errors = req.errors.map(err => ({
    field: err.param || 'unknown',
    message: err.msg
  }));

  res.status(400).json({
    error: 'Validation error',
    details: errors
  });
};

/**
 * Global error handler middleware
 * Should be placed after all routes
 */
const globalErrorHandler = (err, req, res, next) => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Handle specific error types
  if (err.name === 'MongooseValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      details: Object.values(err.errors).map(e => e.message)
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid ID format'
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      error: 'Duplicate entry',
      field: Object.keys(err.keyPattern)[0]
    });
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

  res.status(statusCode).json({
    error: err.name || 'Error',
    message
  });
};

/**
 * 404 handler
 * Should be placed after all routes
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route '${req.method} ${req.path}' not found`
  });
};

/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });

  next();
};

/**
 * Rate limiting middleware
 * Simple in-memory rate limiter for development
 */
const rateLimiter = (windowMs = 15 * 60 * 1000, maxRequests = 100) => {
  const requests = new Map();

  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    if (!requests.has(key)) {
      requests.set(key, []);
    }

    const userRequests = requests.get(key);
    const recentRequests = userRequests.filter(time => time > now - windowMs);

    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        message: 'Please try again later'
      });
    }

    recentRequests.push(now);
    requests.set(key, recentRequests);

    next();
  };
};

module.exports = {
  validationErrorHandler,
  globalErrorHandler,
  notFoundHandler,
  requestLogger,
  rateLimiter
};
