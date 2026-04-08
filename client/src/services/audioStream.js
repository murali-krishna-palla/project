import { API_ENDPOINTS, DEEPGRAM_WS_PARAMS } from '../config/api';

class AudioStreamService {
  constructor() {
    this.DEBUG = false;
    this.ws = null;
    this.isConnected = false;
    this.isDeepgramReady = false;
    this.audioBuffer = [];
    this.onMessage = null;
    this.onError = null;
    this.pendingStop = false; // Flag to send stop AFTER flushing buffer
    this.connectionTimeoutId = null;
  }

  // Default to 16kHz to match vocal (macOS) implementation
  connect(apiKey, model, language, sampleRate = 16000) {
    return new Promise((resolve, reject) => {
      try {
        if (this.DEBUG) console.log('📡 Creating WebSocket to:', API_ENDPOINTS.AUDIO_WS);
        if (this.DEBUG) console.log('🔑 API Key passed:', apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING');
        this.ws = new WebSocket(API_ENDPOINTS.AUDIO_WS);
        this.isDeepgramReady = false;
        this.audioBuffer = [];

        this.ws.onopen = () => {
          this.isConnected = true;
          if (this.connectionTimeoutId) {
            clearTimeout(this.connectionTimeoutId);
            this.connectionTimeoutId = null;
          }
          if (this.DEBUG) console.log('✓ WebSocket connected to backend');
          if (this.DEBUG) console.log('⏳ Waiting for Deepgram connection...');
          
          // Send start signal to backend with actual sample rate
          const startMessage = JSON.stringify({
            action: 'start',
            apiKey,
            model,
            language,
            sampleRate
          });
          
          try {
            // Double-check readyState is OPEN before sending
            if (this.ws.readyState === WebSocket.OPEN) {
              this.ws.send(startMessage);
            } else {
              // Retry after a brief delay if still connecting
              setTimeout(() => {
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                  this.ws.send(startMessage);
                }
              }, 100);
            }
          } catch (err) {
            console.error('Error sending start message:', err.message);
          }
        };

        this.ws.onmessage = (event) => {
          if (this.onMessage) {
            try {
              const data = JSON.parse(event.data);
              if (this.DEBUG) console.log('📨 Message from backend:', data.event || data.type);
              
              // Mark Deepgram as ready when we get connected message
              if (data.event === 'connected') {
                this.isDeepgramReady = true;
                if (this.DEBUG) console.log('✓ Deepgram is ready, sending buffered audio...');
                
                // Send any buffered audio
                this.audioBuffer.forEach(buffer => {
                  if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(buffer);
                  }
                });
                this.audioBuffer = [];
                
                // If stop was called while buffering, send it now
                if (this.pendingStop) {
                  if (this.DEBUG) console.log('⏹️ Sending deferred stop message (buffer was flushed)');
                  this.pendingStop = false;
                  try {
                    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                      this.ws.send(JSON.stringify({ action: 'stop' }));
                    }
                  } catch (err) {
                    console.error('Error sending deferred stop message:', err.message);
                  }
                }
              }
              
              this.onMessage(data);
            } catch (err) {
              console.error('Failed to parse message:', err);
            }
          }
        };

        this.ws.onerror = (error) => {
          this.isConnected = false;
          this.isDeepgramReady = false;
          if (this.DEBUG) console.error('❌ WebSocket error:', error);
          if (this.onError) {
            this.onError(new Error('WebSocket connection failed'));
          }
          reject(error);
        };

        this.ws.onclose = () => {
          this.isConnected = false;
          this.isDeepgramReady = false;
          if (this.DEBUG) console.log('🔌 WebSocket closed');
        };

        // Connection ready once we can send (doesn't mean Deepgram is ready)
        resolve();

        // Add connection timeout
        this.connectionTimeoutId = setTimeout(() => {
          if (!this.isConnected) {
            console.error('⏱️ WebSocket connection timeout');
            reject(new Error('WebSocket connection timeout'));
          }
        }, 5000);
      } catch (err) {
        if (this.DEBUG) console.error('Failed to create WebSocket:', err);
        reject(err);
      }
    });
  }

  sendAudio(buffer) {
    // If Deepgram not ready yet, buffer the audio
    if (!this.isDeepgramReady) {
      if (this.audioBuffer.length === 0) {
        if (this.DEBUG) console.warn('🔄 BUFFERING AUDIO - Deepgram not ready yet. IsConnected:', this.isConnected);
      }
      if (this.audioBuffer.length > 100) {
        if (this.DEBUG) console.warn('⚠️ Audio buffer overflow:', this.audioBuffer.length, 'chunks. Deepgram may not be connecting.');
      }
      this.audioBuffer.push(buffer);
      return;
    }

    if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
      // Debug: log first audio chunk details
      if (this.audioBuffer.length === 0 && this.audioChunksSentToDeepgram === undefined) {
        this.audioChunksSentToDeepgram = 0;
      }
      if (this.audioChunksSentToDeepgram === 0) {
        if (this.DEBUG) console.log(`📊 First audio buffer sent: ${buffer.byteLength || buffer.length} bytes, type: ${buffer.constructor.name}`);
        
        // Check if it's all zeros
        let allZeros = true;
        const view = new Uint8Array(buffer);
        for (let i = 0; i < Math.min(100, view.length); i++) {
          if (view[i] !== 0) {
            allZeros = false;
            break;
          }
        }
        if (this.DEBUG) console.log(`   All zeros: ${allZeros}`);
      }
      this.audioChunksSentToDeepgram = (this.audioChunksSentToDeepgram || 0) + 1;
      
      this.ws.send(buffer);
    } else {
      if (this.DEBUG) console.warn('⚠️ Cannot send audio - WebSocket not ready:', {
        isConnected: this.isConnected,
        wsExists: !!this.ws,
        readyState: this.ws?.readyState,
        isDeepgramReady: this.isDeepgramReady
      });
    }
  }

  stop() {
    if (this.isConnected && this.ws) {
      // If we're still buffering audio, mark that we want to stop
      // The stop will be sent after the buffer is flushed
      if (!this.isDeepgramReady) {
        if (this.DEBUG) console.log('⏹️ Recording stopped - deferring stop signal until buffer flushed');
        this.pendingStop = true;
      } else {
        // If Deepgram is ready, send stop immediately
        if (this.DEBUG) console.log('⏹️ Stopping recording - sending stop signal immediately');
        try {
          if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ action: 'stop' }));
          }
        } catch (err) {
          console.error('Error sending stop message:', err.message);
        }
      }
    }
  }

  disconnect() {
    if (this.ws) {
      if (this.DEBUG) console.log('🔌 Disconnecting WebSocket');
      try {
        this.ws.close();
      } catch (err) {
        console.warn('Error closing WebSocket:', err);
      }
      this.ws = null;
      this.isConnected = false;
      if (this.connectionTimeoutId) {
        clearTimeout(this.connectionTimeoutId);
        this.connectionTimeoutId = null;
      }
    }
  }
}

export default AudioStreamService;
