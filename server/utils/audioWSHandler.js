const DeepgramService = require('../services/deepgramService');
const logger = require('./logger');

const audioWSHandler = (ws, req) => {
  logger.info('WebSocket connected for audio streaming');
  const deepgramService = new DeepgramService();
  let deepgramConnected = false;
  let connectInProgress = false;
  
  ws.on('message', async (msg) => {
    try {
      if (msg instanceof Buffer) {
        if (deepgramConnected) {
          deepgramService.sendAudio(msg);
        } else {
          logger.warn('⚠️ Ignoring audio - Deepgram not yet connected');
        }
      } else if (typeof msg === 'string') {
        const data = JSON.parse(msg);
        
        if (data.action === 'start') {
          // Prevent multiple simultaneous connection attempts
          if (connectInProgress) {
            logger.warn('⚠️ Connection already in progress');
            return;
          }
          
          if (!deepgramConnected) {
            connectInProgress = true;
            try {
              logger.info(`Connecting to Deepgram: model=${data.model}, language=${data.language}, sample_rate=${data.sampleRate}`);
              await deepgramService.connectWebSocket(
                ws, 
                data.apiKey, 
                data.model, 
                data.language,
                data.sampleRate || 16000  // Default to 16kHz (now matching client resampling)
              );
              deepgramConnected = true;
            } catch (err) {
              logger.error('Failed to connect to Deepgram:', err.message);
              deepgramConnected = false;
              ws.send(JSON.stringify({
                event: 'error',
                error: 'Failed to connect to Deepgram: ' + err.message
              }));
            } finally {
              connectInProgress = false;
            }
          }
          deepgramService.startRecording(data.model, data.language);
        } else if (data.action === 'stop') {
          deepgramService.stopRecording();
        }
      }
    } catch (err) {
      logger.error('WebSocket message error:', err);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          event: 'error',
          error: err.message
        }));
      }
    }
  });
  
  ws.on('close', () => {
    logger.info('WebSocket closed');
    deepgramService.closeConnection();
    deepgramConnected = false;
  });
  
  ws.on('error', (err) => {
    logger.error('WebSocket error:', err);
    deepgramConnected = false;
  });
};

module.exports = audioWSHandler;
