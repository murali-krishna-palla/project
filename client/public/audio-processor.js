/**
 * Audio Worklet Processor
 * Replaces deprecated ScriptProcessorNode
 * Applies 3x gain amplification to compensate for quiet microphones
 */

class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.gain = 3.0; // 3x amplification for quiet microphones
    this.silenceCounter = 0;
  }

  process(inputs, outputs) {
    const input = inputs[0];
    
    if (!input || input.length === 0) {
      console.warn('⚠️ Audio Processor: No input channels available');
      return true;
    }
    
    const audioData = input[0];
    if (!audioData || audioData.length === 0) {
      console.warn('⚠️ Audio Processor: Input channel is empty');
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
        console.warn('⚠️ Audio Processor: Receiving silence - check microphone');
      }
    } else {
      if (this.silenceCounter > 0) {
        console.log(`✓ Audio Processor: Audio detected after ${this.silenceCounter} silent frames`);
      }
      this.silenceCounter = 0;
    }
    
    // Apply gain amplification directly to the audio data
    const amplifiedData = new Float32Array(audioData.length);
    for (let i = 0; i < audioData.length; i++) {
      amplifiedData[i] = audioData[i] * this.gain;
      // Clamp to prevent clipping
      if (amplifiedData[i] > 1.0) amplifiedData[i] = 1.0;
      if (amplifiedData[i] < -1.0) amplifiedData[i] = -1.0;
    }
    
    this.port.postMessage({
      type: 'audio',
      data: amplifiedData
    });
    
    // Also output to speakers so users can monitor (will be muted by app)
    const output = outputs[0];
    if (output && output[0]) {
      output[0].set(amplifiedData);
    }
    
    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor);
