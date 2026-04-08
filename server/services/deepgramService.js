const WebSocket = require('ws');
const axios = require('axios');
const logger = require('../utils/logger');
const constants = require('../config/constants');

/**
 * Business Logic Layer - Service for Deepgram ASR
 */
class DeepgramService {
  constructor() {
    this.deepgramWs = null;
    this.clientWs = null;
    this.accumulatedTranscript = '';
    this.isRecording = false;
    this.audioChunksReceived = 0;
    this.isWaitingForFinal = false;
  }

  async connectWebSocket(clientWs, apiKey, model, language, sampleRate = 16000) {
    this.clientWs = clientWs;
    
    // Validate API key
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('Deepgram API key is required');
    }

    const deepgramUrl = `${constants.DEEPGRAM.WS_URL}?encoding=${constants.AUDIO.ENCODING}&sample_rate=${sampleRate}&channels=${constants.AUDIO.CHANNELS}&punctuate=true&interim_results=true&model=${model || constants.DEEPGRAM.DEFAULT_MODEL}&language=${language || constants.DEEPGRAM.DEFAULT_LANGUAGE}`;

    logger.info(`🔗 Full Deepgram URL: ${deepgramUrl}`);
    logger.info(`Deepgram URL: ${deepgramUrl.split('?')[0]}`);
    logger.info(`Model: ${model}, Language: ${language}, Sample Rate: ${sampleRate}Hz`);

    try {
      this.deepgramWs = new WebSocket(deepgramUrl, {
        headers: {
          Authorization: `Token ${apiKey}`
        }
      });

      this.deepgramWs.on('open', () => {
        logger.info('✓ Connected to Deepgram');
        this.clientWs.send(JSON.stringify({
          event: 'connected',
          message: 'Connected to Deepgram'
        }));
      });

      this.deepgramWs.on('message', (data) => {
        this.handleMessage(data);
      });

      this.deepgramWs.on('close', (code, reason) => {
        logger.info(`Deepgram WebSocket closed - Code: ${code}, Reason: ${reason}`);
      });

      this.deepgramWs.on('error', (err) => {
        logger.error('Deepgram WebSocket error:', {
          message: err.message,
          code: err.code,
          errno: err.errno
        });
        this.clientWs.send(JSON.stringify({
          event: 'error',
          error: 'Deepgram error: ' + (err.message || 'Connection failed')
        }));
      });
    } catch (err) {
      logger.error('Error connecting to Deepgram:', {
        message: err.message,
        code: err.code
      });
      throw err;
    }
  }

  handleMessage(data) {
    try {
      const response = JSON.parse(data);
      
      // Log full response structure for debugging
      if (response.is_final || response.type === 'Results') {
        logger.info('📥 Deepgram FULL response:', JSON.stringify(response, null, 2));
      }
      
      // Log summary
      logger.info('Deepgram response:', {
        type: response.type,
        is_final: response.is_final,
        hasTranscript: !!response.channel?.alternatives?.[0]?.transcript,
        confidence: response.channel?.alternatives?.[0]?.confidence
      });

      const transcript = response.channel?.alternatives?.[0]?.transcript || '';

      if (response.is_final && transcript.trim()) {
        // Match reference behavior: accumulate non-empty final chunks.
        this.accumulatedTranscript = this.accumulatedTranscript
          ? `${this.accumulatedTranscript} ${transcript}`
          : transcript;
      }

      // Emit interim only when non-empty.
      if (!response.is_final && transcript.trim()) {
        const interim = response.channel.alternatives[0].transcript;
        logger.info('Interim transcript:', interim);

        this.clientWs.send(JSON.stringify({
          event: 'interim_transcript',
          transcript: interim,
          isFinal: false
        }));
      }

      // Emit one final transcript only when Deepgram signals stream finalized.
      if (this.isWaitingForFinal && response.is_final) {
        logger.info('Final transcript:', this.accumulatedTranscript || '(EMPTY - no speech detected)');
        this.clientWs.send(JSON.stringify({
          event: 'final_transcript',
          transcript: this.accumulatedTranscript,
          isFinal: true
        }));
        // Reset flag so we don't emit multiple final responses
        this.isWaitingForFinal = false;
      }
    } catch (err) {
      logger.error('Error parsing Deepgram response:', err.message);
    }
  }

  sendAudio(audioBuffer) {
    if (!this.deepgramWs) {
      logger.warn('⚠️ Deepgram WebSocket not initialized');
      return false;
    }

    if (this.deepgramWs.readyState !== WebSocket.OPEN) {
      logger.warn(`⚠️ Deepgram WebSocket not open. State: ${this.deepgramWs.readyState}`);
      return false;
    }

    try {
      if (!Buffer.isBuffer(audioBuffer)) {
        // Convert to Buffer if needed
        if (audioBuffer instanceof ArrayBuffer || ArrayBuffer.isView(audioBuffer)) {
          audioBuffer = Buffer.from(audioBuffer);
        } else {
          logger.error('Invalid audio buffer format:', typeof audioBuffer);
          return false;
        }
      }

      // Log first audio chunk size and first few bytes for debugging
      if (this.audioChunksReceived === 0) {
        const firstBytes = audioBuffer.slice(0, 20);
        const bufferHex = firstBytes.toString('hex');
        logger.info(`📥 First audio chunk received: ${audioBuffer.length} bytes`);
        logger.info(`   Hex: ${bufferHex}`);
        logger.info(`   Type: ${Buffer.isBuffer(audioBuffer) ? 'Buffer' : typeof audioBuffer}`);
        
        // Try to parse as Int16 and check for data
        if (audioBuffer.length >= 2) {
          const int16view = new Int16Array(audioBuffer.buffer, audioBuffer.byteOffset, audioBuffer.length / 2);
          const firstSamples = [];
          for (let i = 0; i < Math.min(10, int16view.length); i++) {
            firstSamples.push(int16view[i]);
          }
          logger.info(`   As Int16 samples: [${firstSamples.join(', ')}]`);
        }
      }

      this.deepgramWs.send(audioBuffer, { binary: true }, (err) => {
        if (err) {
          logger.error('Error sending audio chunk:', err.message);
        }
      });

      this.audioChunksReceived++;
      
      // Log every 50 chunks to avoid spam
      if (this.audioChunksReceived % 50 === 0) {
        const seconds = (this.audioChunksReceived * 320 / 16000).toFixed(2);
        logger.info(`📤 Sent ${this.audioChunksReceived} audio chunks to Deepgram (${seconds}s)`);
      }

      return true;
    } catch (err) {
      logger.error('Exception in sendAudio:', err.message);
      return false;
    }
  }

  startRecording(model, language) {
    this.isRecording = true;
    this.accumulatedTranscript = '';
    this.audioChunksReceived = 0;
    this.isWaitingForFinal = false;
    logger.info(`🎤 Recording started: model=${model}, language=${language}`);
  }

  stopRecording() {
    this.isRecording = false;
    this.isWaitingForFinal = true;
    logger.info(`⏹️ Recording stopped. Total chunks: ${this.audioChunksReceived}`);
    
    if (this.deepgramWs && this.deepgramWs.readyState === WebSocket.OPEN) {
      // Send empty buffer to signal end of audio
      this.deepgramWs.send(Buffer.alloc(0));
      
      // Force send final transcript after 2 seconds if Deepgram hasn't responded
      // This handles edge cases where Deepgram doesn't send is_final for silent audio
      setTimeout(() => {
        if (this.isWaitingForFinal) {
          logger.warn('⚠️ No final response from Deepgram after 2s, forcing final transcript');
          logger.info('Final transcript (forced):', this.accumulatedTranscript || '(silent or no speech)');
          this.clientWs.send(JSON.stringify({
            event: 'final_transcript',
            transcript: this.accumulatedTranscript,
            isFinal: true,
            forced: true
          }));
          this.isWaitingForFinal = false;
        }
      }, 2000);  // 2 second timeout
    }
  }

  closeConnection() {
    if (this.deepgramWs) {
      this.deepgramWs.close();
      this.deepgramWs = null;
    }
  }

  async fetchModels(apiKey) {
    try {
      logger.info('🔑 Testing Deepgram API key...');
      const response = await axios.get(
        `${constants.DEEPGRAM.API_URL}/models`,
        {
          headers: {
            Authorization: `Token ${apiKey}`
          }
        }
      );

      logger.info('✓ API key is VALID - can access Deepgram');

      // Deepgram returns models in this structure: { "stt": [...], "tts": [...] }
      const models = response.data.stt || [];
      
      logger.info(`Available STT models: ${models.map(m => m.canonical_name).join(', ')}`);
      
      // Filter to only streaming models and map to expected format
      return models
        .filter(m => m.streaming === true)
        .map(m => ({
          canonicalName: m.canonical_name,
          displayName: m.display_name || m.canonical_name,
          languages: m.language || []
        }));
    } catch (err) {
      logger.error('❌ API key validation FAILED:', {
        status: err.response?.status,
        message: err.response?.data?.msg || err.message
      });
      if (err.response?.status === 401) {
        logger.error('Invalid Deepgram API key');
      }
      return [];
    }
  }

  async getBalance(apiKey) {
    try {
      logger.info('📊 Fetching Deepgram balance...');
      
      // First, get projects (this works with basic key)
      const projectsResponse = await axios.get(
        `${constants.DEEPGRAM.API_URL}/projects`,
        {
          headers: {
            Authorization: `Token ${apiKey}`
          }
        }
      );

      const projects = projectsResponse.data.projects || [];
      if (projects.length === 0) {
        return {
          status: 'error',
          message: 'No projects found'
        };
      }

      const project = projects[0];
      const projectId = project.project_id;

      // Try to get project details
      try {
        const detailsResponse = await axios.get(
          `${constants.DEEPGRAM.API_URL}/projects/${projectId}`,
          {
            headers: {
              Authorization: `Token ${apiKey}`
            }
          }
        );

        const details = detailsResponse.data;
        logger.info('✓ Retrieved Deepgram project details');
        
        return {
          status: 'success',
          projectName: project.name,
          projectId: projectId,
          balance: details.balance || 'N/A',
          creditBalance: details.credit_balance || 'N/A',
          requestCount: details.request_count || 0,
          apiValid: true
        };
      } catch (detailErr) {
        // Check if it's a permission error
        if (detailErr.response?.status === 403) {
          const errorMsg = detailErr.response?.data?.details || '';
          
          return {
            status: 'partial',
            projectName: project.name,
            projectId: projectId,
            apiValid: true,
            message: '⚠️ API key needs additional scopes to view balance. To enable balance viewing: 1) Go to console.deepgram.com → Settings → API Keys 2) Regenerate your key with "project:read" and "usage:read" scopes enabled'
          };
        }
        
        // Try usage endpoint as fallback
        try {
          const usageResponse = await axios.get(
            `${constants.DEEPGRAM.API_URL}/projects/${projectId}/usage`,
            {
              headers: {
                Authorization: `Token ${apiKey}`
              }
            }
          );

          const usage = usageResponse.data;
          logger.info('✓ Retrieved Deepgram usage info');

          return {
            status: 'success',
            projectName: project.name,
            projectId: projectId,
            totalRequests: usage.requests || 0,
            totalHours: usage.hours || 0,
            startTime: usage.start_time,
            endTime: usage.end_time,
            apiValid: true
          };
        } catch (usageErr) {
          if (usageErr.response?.status === 403) {
            return {
              status: 'partial',
              projectName: project.name,
              projectId: projectId,
              apiValid: true,
              message: '⚠️ API key needs additional scopes. Go to console.deepgram.com → Settings → API Keys → Regenerate with "usage:read" scope enabled'
            };
          }

          // If both fail, return at least the project info
          return {
            status: 'success',
            projectName: project.name,
            projectId: projectId,
            message: '✓ API key verified - View balance at console.deepgram.com or regenerate key with project:read & usage:read scopes',
            apiValid: true
          };
        }
      }
    } catch (err) {
      logger.error('❌ Failed to fetch Deepgram balance:', err.message);
      return {
        status: 'error',
        message: err.response?.status === 401 ? '❌ Invalid API key' : '❌ Failed to fetch balance',
        apiValid: false
      };
    }
  }
}

module.exports = DeepgramService;
