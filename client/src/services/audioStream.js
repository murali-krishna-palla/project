import { API_ENDPOINTS, DEEPGRAM_WS_PARAMS } from '../config/api';

class AudioStreamService {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.isDeepgramReady = false;
    this.audioBuffer = [];
    this.onMessage = null;
    this.onError = null;
    this.pendingStop = false; // Flag to send stop AFTER flushing buffer
    this.connectionTimeoutId = null;
  }

  connect(apiKey, model, language, sampleRate = 48000) {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(API_ENDPOINTS.AUDIO_WS);
        this.isDeepgramReady = false;
        this.audioBuffer = [];

        this.ws.onopen = () => {
          this.isConnected = true;
          if (this.connectionTimeoutId) {
            clearTimeout(this.connectionTimeoutId);
            this.connectionTimeoutId = null;
          }
          console.log('✓ WebSocket connected to backend');
          console.log('⏳ Waiting for Deepgram connection...');
          
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
              console.log('📨 Message from backend:', data.event || data.type);
              
              // Mark Deepgram as ready when we get connected message
              if (data.event === 'connected') {
                this.isDeepgramReady = true;
                console.log('✓ Deepgram is ready, sending buffered audio...');
                
                // Send any buffered audio
                this.audioBuffer.forEach(buffer => {
                  if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(buffer);
                  }
                });
                this.audioBuffer = [];
                
                // If stop was called while buffering, send it now
                if (this.pendingStop) {
                  console.log('⏹️ Sending deferred stop message (buffer was flushed)');
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
          console.error('❌ WebSocket error:', error);
          if (this.onError) {
            this.onError(new Error('WebSocket connection failed'));
          }
          reject(error);
        };

        this.ws.onclose = () => {
          this.isConnected = false;
          this.isDeepgramReady = false;
          console.log('🔌 WebSocket closed');
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
        console.error('Failed to create WebSocket:', err);
        reject(err);
      }
    });
  }

  sendAudio(buffer) {
    // If Deepgram not ready yet, buffer the audio
    if (!this.isDeepgramReady) {
      if (this.audioBuffer.length === 0) {
        console.log('🔄 Buffering audio until Deepgram is ready...');
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
        console.log(`📊 First audio buffer sent: ${buffer.byteLength || buffer.length} bytes, type: ${buffer.constructor.name}`);
        
        // Check if it's all zeros
        let allZeros = true;
        const view = new Uint8Array(buffer);
        for (let i = 0; i < Math.min(100, view.length); i++) {
          if (view[i] !== 0) {
            allZeros = false;
            break;
          }
        }
        console.log(`   All zeros: ${allZeros}`);
      }
      this.audioChunksSentToDeepgram = (this.audioChunksSentToDeepgram || 0) + 1;
      
      this.ws.send(buffer);
    } else {
      console.warn('⚠️ Cannot send audio - WebSocket not ready:', {
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
        console.log('⏹️ Recording stopped - deferring stop signal until buffer flushed');
        this.pendingStop = true;
      } else {
        // If Deepgram is ready, send stop immediately
        console.log('⏹️ Stopping recording - sending stop signal immediately');
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
      console.log('🔌 Disconnecting WebSocket');
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
