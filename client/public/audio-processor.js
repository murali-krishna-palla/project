/**
 * Audio Worklet Processor
 * Replaces deprecated ScriptProcessorNode
 * Applies 3x gain amplification to compensate for quiet microphones
 */

class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.DEBUG = false;
    this.gain = 3.0; // 3x amplification for quiet microphones
    this.silenceCounter = 0;
    this.audioChunkCount = 0;
    this.lastWarning = 0;
    this.hasLoggedSuccess = false;
  }

  process(inputs, outputs) {
    const input = inputs[0];
    
    if (!input || input.length === 0) {
      const now = Date.now();
      if (now - this.lastWarning > 5000) { // Log warning once every 5 seconds
        if (this.DEBUG) console.warn('⚠️ Audio Processor: No input channels available');
        this.lastWarning = now;
      }
      return true;
    }
    
    const audioData = input[0];
    if (!audioData || audioData.length === 0) {
      const now = Date.now();
      if (now - this.lastWarning > 5000) {
        if (this.DEBUG) console.warn('⚠️ Audio Processor: Input channel is empty');
        this.lastWarning = now;
      }
      return true;
    }
    
    // Check if audio data is all zeros (silence)
    let hasAudio = false;
    for (let i = 0; i < audioData.length; i++) {
      if (Math.abs(audioData[i]) > 0.001) {
        hasAudio = true;
        break;
      }
    }
    
    if (!hasAudio) {
      this.silenceCounter++;
      if (this.silenceCounter === 1) {
        if (this.DEBUG) console.warn('⚠️ Audio Processor: Receiving silence - check microphone');
      }
    } else {
      if (!this.hasLoggedSuccess) {
        if (this.DEBUG) console.log('✓ Audio Processor: Audio detected! Processing audio chunks');
        this.hasLoggedSuccess = true;
      }
      this.silenceCounter = 0;
    }
    
    // Audio is already amplified by gainNode (3.0x) before reaching this processor
    // Just pass it through to main thread - no need to apply gain again
    this.audioChunkCount++;
    this.port.postMessage({
      type: 'audio',
      data: audioData
    });

    return true; // Keep processing
  }
}

registerProcessor('audio-processor', AudioProcessor);
