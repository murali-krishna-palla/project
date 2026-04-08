/**
 * Audio Worklet - Runs in separate thread for audio processing
 * This replaces the deprecated ScriptProcessorNode
 */

class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
  }

  process(inputs, outputs) {
    const input = inputs[0];
    
    if (input && input.length > 0) {
      const audioData = input[0];
      // Send audio data to main thread
      this.port.postMessage({
        type: 'audio',
        data: audioData
      });
    }

    return true; // Keep processing
  }
}

// Register the processor
registerProcessor('audio-processor', AudioProcessor);
