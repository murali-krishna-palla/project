/**
 * Audio Resampler - Converts audio from any sample rate to target sample rate
 * Essential for Windows web app to work correctly with Deepgram (expects 16kHz)
 */

class AudioResampler {
  constructor(inputSampleRate, outputSampleRate = 16000) {
    this.inputSampleRate = inputSampleRate;
    this.outputSampleRate = outputSampleRate;
    this.ratio = outputSampleRate / inputSampleRate;
    
    // For linear interpolation between samples
    this.lastSample = 0;
    
    console.log(`🔄 AudioResampler initialized: ${inputSampleRate}Hz → ${outputSampleRate}Hz (ratio: ${this.ratio.toFixed(4)})`);
    if (outputSampleRate !== 16000) {
      console.warn(`⚠️ Output sample rate is ${outputSampleRate}Hz (expected 16000Hz for Deepgram)`);
    }
  }

  /**
   * Resample Float32 audio data using linear interpolation
   * @param {Float32Array} inputSamples - Input audio samples
   * @returns {Float32Array} Resampled audio
   */
  resample(inputSamples) {
    if (Math.abs(this.ratio - 1.0) < 0.001) {
      // No resampling needed if rates are same
      return new Float32Array(inputSamples);
    }

    const outputLength = Math.ceil(inputSamples.length * this.ratio);
    const output = new Float32Array(outputLength);

    for (let i = 0; i < outputLength; i++) {
      const inputIndex = i / this.ratio;
      const inputIndexInt = Math.floor(inputIndex);
      const frac = inputIndex - inputIndexInt;

      // Get samples for linear interpolation
      let sample1 = inputIndexInt > 0 ? inputSamples[inputIndexInt - 1] : this.lastSample;
      let sample2 = inputSamples[inputIndexInt];

      // Handle boundary
      if (inputIndexInt >= inputSamples.length - 1) {
        sample2 = inputIndexInt < inputSamples.length ? inputSamples[inputIndexInt] : sample1;
      }

      // Linear interpolation
      output[i] = sample1 + (sample2 - sample1) * frac;
    }

    // Store last sample for next iteration
    if (inputSamples.length > 0) {
      this.lastSample = inputSamples[inputSamples.length - 1];
    }

    return output;
  }

  /**
   * Resample and convert to Int16Array (raw PCM for transmission)
   * @param {Float32Array} inputSamples 
   * @returns {Int16Array} Resampled audio as Int16
   */
  resampleToInt16(inputSamples) {
    const resampled = this.resample(inputSamples);
    const output = new Int16Array(resampled.length);

    for (let i = 0; i < resampled.length; i++) {
      let sample = resampled[i];
      // Clamp to [-1, 1]
      sample = sample > 1.0 ? 1.0 : (sample < -1.0 ? -1.0 : sample);
      // Convert to Int16
      output[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    }

    return output;
  }

  /**
   * Reset the resampler state (call when starting a new recording)
   */
  reset() {
    this.lastSample = 0;
  }
}

export default AudioResampler;
