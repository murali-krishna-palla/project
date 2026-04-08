/**
 * Audio Debug Utility
 * Run this to diagnose microphone and audio capture issues
 */

export const debugAudio = async () => {
  console.log('🔍 Starting audio diagnostics...\n');

  try {
    // Step 1: Request microphone
    console.log('📍 Step 1: Requesting microphone access...');
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log('✓ Microphone access granted');
    console.log(`  Stream ID: ${stream.id}`);
    console.log(`  Audio tracks: ${stream.getAudioTracks().length}`);
    
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      console.log(`  Track label: ${audioTrack.label}`);
      console.log(`  Track enabled: ${audioTrack.enabled}`);
      console.log(`  Track state: ${audioTrack.readyState}`);
    }

    // Step 2: Create audio context
    console.log('\n📍 Step 2: Creating audio context...');
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    console.log(`✓ Audio context created at ${audioContext.sampleRate}Hz`);
    console.log(`  State: ${audioContext.state}`);

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
      console.log(`  Resumed (was suspended)`);
    }

    // Step 3: Create source and monitor levels
    console.log('\n📍 Step 3: Monitoring audio levels...');
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let maxValue = 0;

    const monitorInterval = setInterval(() => {
      analyser.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
      if (avg > maxValue) maxValue = avg;
      console.log(`  Audio level: ${avg.toFixed(0)}/255 (max so far: ${maxValue.toFixed(0)}/255)`);
    }, 500);

    // Step 4: Create AudioWorklet processor to examine raw data
    console.log('\n📍 Step 4: Testing AudioWorklet processor...');
    try {
      // Create inline worklet for testing
      const workletCode = `
        class TestProcessor extends AudioWorkletProcessor {
          constructor() {
            super();
            this.maxSample = 0;
            this.samples = 0;
          }
          
          process(inputs, outputs) {
            const input = inputs[0];
            if (input && input[0]) {
              const channel = input[0];
              for (let i = 0; i < channel.length; i++) {
                const sample = Math.abs(channel[i]);
                if (sample > this.maxSample) {
                  this.maxSample = sample;
                }
                this.samples++;
              }
              
              if (this.samples % 2048 === 0) {
                this.port.postMessage({
                  type: 'stats',
                  maxSample: this.maxSample,
                  samples: this.samples,
                  firstSample: channel[0]
                });
                this.maxSample = 0;
              }
            }
            return true;
          }
        }
        registerProcessor('test-processor', TestProcessor);
      `;

      const blob = new Blob([workletCode], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      await audioContext.audioWorklet.addModule(url);

      const processor = new AudioWorkletNode(audioContext, 'test-processor');
      source.connect(processor);

      processor.port.onmessage = (event) => {
        const { maxSample, samples, firstSample } = event.data;
        console.log(`  AudioWorklet: max sample=${maxSample.toFixed(4)}, total=${samples}, first=${firstSample.toFixed(4)}`);
      };

      console.log('✓ AudioWorklet processor initialized');
    } catch (err) {
      console.warn(`⚠️ AudioWorklet test failed: ${err.message}`);
    }

    // Step 5: Summary
    console.log('\n📍 Diagnostic Summary:');
    console.log('✓ Microphone access: GRANTED');
    console.log('✓ Audio context: RUNNING');
    console.log(`✓ Sample rate: ${audioContext.sampleRate}Hz`);
    console.log('⏳ Audio levels streaming above...');
    console.log('\nSpeak into your microphone. Levels should increase significantly:');
    console.log('  - Silent room: 5-20/255');
    console.log('  - Normal speech: 50-100/255');
    console.log('  - Loud speech: 100-200/255');

    // Auto-stop after 30 seconds
    setTimeout(() => {
      clearInterval(monitorInterval);
      stream.getTracks().forEach(track => track.stop());
      audioContext.close();
      console.log('\n✓ Diagnostics complete. Stream closed.');
    }, 30000);

  } catch (err) {
    console.error(`❌ Diagnostic failed: ${err.message}`);
    console.error(err);
  }
};

// Run via: import { debugAudio } from './utils/audioDebug'; debugAudio();
