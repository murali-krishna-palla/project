const DeepgramService = require('../services/deepgramService');
const logger = require('./logger');

const audioWSHandler = (ws, req) => {
  logger.info('WebSocket connected for audio streaming');
  const deepgramService = new DeepgramService();
  let deepgramConnected = false;
  
  ws.on('message', async (msg) => {
    try {
      if (msg instanceof Buffer) {
        if (deepgramConnected) {
          deepgramService.sendAudio(msg);
        }
      } else if (typeof msg === 'string') {
        const data = JSON.parse(msg);
        
        if (data.action === 'start') {
          // Connect to Deepgram AFTER receiving API key
          if (!deepgramConnected) {
            logger.info(`Connecting to Deepgram: model=${data.model}, language=${data.language}, sample_rate=${data.sampleRate}`);
            await deepgramService.connectWebSocket(
              ws, 
              data.apiKey, 
              data.model, 
              data.language,
              data.sampleRate || 48000  // Default to 48kHz if not provided
            );
            deepgramConnected = true;
          }
          deepgramService.startRecording(data.model, data.language);
        } else if (data.action === 'stop') {
          deepgramService.stopRecording();
        }
      }
    } catch (err) {
      logger.error('WebSocket message error:', err);
      ws.send(JSON.stringify({
        event: 'error',
        error: err.message
      }));
    }
  });
  
  ws.on('close', () => {
    logger.info('WebSocket closed');
    deepgramService.closeConnection();
  });
  
  ws.on('error', (err) => {
    logger.error('WebSocket error:', err);
  });
};

module.exports = audioWSHandler;
