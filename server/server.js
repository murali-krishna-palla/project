const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const expressWs = require('express-ws');

const connectDB = require('./config/database');
const logger = require('./utils/logger');
const audioWSHandler = require('./utils/audioWSHandler');

dotenv.config();

const app = express();
expressWs(app);

// ============ MIDDLEWARE ============
app.use(cors());
app.use(express.json());

// ============ DATABASE ============
connectDB();

// ============ ROUTES ============
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/recordings', require('./routes/recordingRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));

// ============ WEBSOCKET ============
app.ws('/ws/audio', audioWSHandler);

// ============ ERROR HANDLING ============
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============ SERVER START ============
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`✓ Server running on http://localhost:${PORT}`);
});
