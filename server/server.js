const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const expressWs = require('express-ws');

const connectDB = require('./config/database');
const logger = require('./utils/logger');
const audioWSHandler = require('./utils/audioWSHandler');
const {
  requestLogger,
  rateLimiter,
  globalErrorHandler,
  notFoundHandler
} = require('./middleware/errorHandler');

dotenv.config();

const app = express();
expressWs(app);

// ============ MIDDLEWARE ============
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use(rateLimiter(15 * 60 * 1000, 1000)); // 1000 requests per 15 minutes

// ============ DATABASE ============
connectDB();

// ============ ROUTES ============
// Auth routes don't require authentication
app.use('/api/auth', require('./routes/authRoutes'));

// Protected routes
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/recordings', require('./routes/recordingRoutes'));

// ============ WEBSOCKET ============
app.ws('/ws/audio', audioWSHandler);

// ============ ERROR HANDLING ============
// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(globalErrorHandler);

// ============ SERVER START ============
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`✓ Server running on http://localhost:${PORT}`);
  logger.info(`✓ Environment: ${process.env.NODE_ENV}`);
  logger.info(`✓ Database: ${process.env.MONGODB_URI.substring(0, 30)}...`);
});
