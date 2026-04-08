import { useState, useCallback, useRef } from 'react';
import { AUDIO_CONFIG } from '../config/constants';
import AudioStreamService from '../services/audioStream';
import AudioMuterService from '../services/audioMuter';
import AudioResampler from '../utils/audioResampler';

/**
 * Business Logic Layer - Hook for Audio Recording
 */
export const useAudioRecorder = (onTranscript) => {
  const DEBUG = false;
  const debugLog = (...args) => {
    if (DEBUG) {
      console.log(...args);
    }
  };
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const gainNodeRef = useRef(null);
  const streamServiceRef = useRef(new AudioStreamService());
  const resamplerRef = useRef(null);  // Add resampler reference
  const startTimeRef = useRef(Date.now());
  const transcriptReceivedRef = useRef(false);  // Track if we got response from Deepgram
  const isStoppingRef = useRef(false);  // Flag to stop processing audio chunks
  const lastLevelUpdateRef = useRef(0);

  const startRecording = useCallback(async (apiKey, model, language, options = {}) => {
    try {
      debugLog('\n🎙️ ===== AUDIO RECORDING START =====');
      setError(null);
      setIsRecording(true);
      setAudioLevel(0);
      startTimeRef.current = Date.now();
      isStoppingRef.current = false;

      // Request microphone access with optional device selection
      debugLog('🎤 Requesting microphone access...');
      let stream;
      try {
        // Try basic request first
        const audioConstraints = options.deviceId
          ? { deviceId: { exact: options.deviceId } }
          : true;
        stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
        debugLog('✓ Got initial stream for microphone test');
      } catch (err) {
        console.error('❌ Basic audio request failed:', err.message);
        throw new Error('Failed to get microphone access: ' + err.message);
      }
      
      // Check if microphone is actually active
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error('❌ No audio tracks available - check microphone connection');
      }
      debugLog(`✓ Microphone obtained - ${audioTracks.length} audio track(s)`);
      debugLog(`  Track enabled: ${audioTracks[0].enabled}`);
      debugLog(`  Track state: ${audioTracks[0].readyState}`);
      const settings = audioTracks[0].getSettings?.();
      if (settings) {
        debugLog(`  🎙️ Settings - Sample rate: ${settings.sampleRate}Hz, Channel count: ${settings.channelCount}`);
      }

      let recordStream = stream;

      if (options.micTestEnabled !== false) {
        // TEST MICROPHONE: Check if it's actually capturing audio
        debugLog('🔍 MICROPHONE TEST STARTING...');
        const testContext = new (window.AudioContext || window.webkitAudioContext)();
        debugLog(`   Test context sample rate: ${testContext.sampleRate}Hz`);
        
        // Resume audio context if suspended
        if (testContext.state === 'suspended') {
          await testContext.resume();
          debugLog('   ℹ️ Test audio context resumed');
        }
        
        const testSource = testContext.createMediaStreamSource(stream);
        const testScriptProcessor = testContext.createScriptProcessor(2048, 1, 1);
        testSource.connect(testScriptProcessor);
        testScriptProcessor.connect(testContext.destination);
        debugLog('   ✓ Test processor connected to destination');
        
        let testAudioDetected = false;
        let testBuffersSampled = 0;
        let maxSampleValue = 0;
        
        // Listen for actual audio data
        testScriptProcessor.onaudioprocess = (event) => {
          testBuffersSampled++;
          const rawData = event.inputBuffer.getChannelData(0);
          
          // Track max value for diagnostics
          for (let i = 0; i < rawData.length; i++) {
            const absValue = Math.abs(rawData[i]);
            if (absValue > maxSampleValue) {
              maxSampleValue = absValue;
            }
            // Lower threshold for initial detection
            if (absValue > 0.001 && !testAudioDetected) {
              testAudioDetected = true;
              debugLog(`✓ Microphone TEST: Audio detected! Sample value: ${rawData[i].toFixed(6)}, Max so far: ${maxSampleValue.toFixed(6)}`);
            }
          }
        };

        // Wait 2 seconds for test (more time for microphone to activate)
        debugLog('   ⏳ Listening for audio input (speak now)...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        debugLog(`   ✓ TEST WAIT COMPLETE - Audio detected: ${testAudioDetected}, Buffers sampled: ${testBuffersSampled}`);
        
        if (!testAudioDetected) {
          console.warn('⚠️ Microphone TEST FAILED: Only silence detected');
          console.warn(`📊 Diagnostic: Sampled ${testBuffersSampled} buffers, Max sample value: ${maxSampleValue.toFixed(6)}`);
          console.warn('💡 Troubleshooting:');
          console.warn('  1. Check Windows Sound Settings - verify microphone is not muted or disabled');
          console.warn('  2. Make sure microphone is selected as the default input device');
          console.warn('  3. Check browser permissions - allow microphone access for this site');
          console.warn('  4. Try restarting your browser');
          console.warn('  5. Test microphone in Google Meet or another app first');
          console.warn('  6. Speak LOUDLY into the microphone during the test');
          
          // Clean up test resources
          testScriptProcessor.disconnect();
          testSource.disconnect();
          testContext.close();
          stream.getTracks().forEach(track => track.stop());
          
          throw new Error(`❌ Microphone test failed - no audio detected (max level: ${maxSampleValue.toFixed(6)}). Check microphone connection and Windows Sound Settings.`);
        }
        
        debugLog(`✓ Microphone test passed! Detected audio in ${testBuffersSampled} buffers (max level: ${maxSampleValue.toFixed(6)})`);
        
        // Clean up test resources
        testScriptProcessor.disconnect();
        testSource.disconnect();
        testContext.close();
        
        // Stop and restart the stream fresh for actual recording
        stream.getTracks().forEach(track => track.stop());
        debugLog('🔄 Restarting microphone stream for recording...');
        try {
          const audioConstraints = options.deviceId
            ? { deviceId: { exact: options.deviceId } }
            : true;
          recordStream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
        } catch (err) {
          throw new Error('Failed to restart audio stream: ' + err.message);
        }
        
        if (recordStream.getAudioTracks().length === 0) {
          throw new Error('❌ Failed to restart audio stream');
        }
        debugLog('✓ Fresh microphone stream obtained for recording');
      }

      // Always create fresh audio context for each recording
      // Don't reuse closed contexts as they cause permission issues
      let audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      } else if (audioContext.state === 'closed') {
        throw new Error('Failed to create audio context');
      }

      // Log the actual browser sample rate
      debugLog(`🎵 Browser audio context sample rate: ${audioContext.sampleRate}Hz`);

      // Initialize resampler to convert browser audio to 16kHz for Deepgram
      resamplerRef.current = new AudioResampler(audioContext.sampleRate, 16000);

      // Optional short delay to mirror desktop pre-mute timing
      if (options.preMuteDelayMs && options.preMuteDelayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, options.preMuteDelayMs));
      }

      // Initialize audio muter
      const muterReady = AudioMuterService.initialize(audioContext);
      if (muterReady) {
        AudioMuterService.mute();
      } else {
        console.warn('⚠️ Audio muter unavailable - continuing without muting');
      }

      // Setup audio processing with gain
      if (audioContext.state !== 'running' && audioContext.state !== 'suspended') {
        throw new Error('Audio context not in valid state');
      }
      
      // Use the fresh recordStream, not the test stream
      const source = audioContext.createMediaStreamSource(recordStream);
      debugLog('✓ Media stream source created');
      mediaStreamRef.current = recordStream; // Store the fresh stream
      
      // Add gain node to amplify microphone signal (fixes low volume issue)
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 3.0; // 3x amplification for quiet microphones
      source.connect(gainNode);
      gainNodeRef.current = gainNode;
      debugLog('🔊 Audio gain node initialized (3x amplification)');
      
      let processorReady = false;
      let processor;
      let audioChunkCount = 0;

      // Prefer AudioWorklet to avoid ScriptProcessor deprecation warnings
      if (audioContext.audioWorklet && audioContext.state !== 'closed') {
        try {
          await audioContext.audioWorklet.addModule('/audio-processor.js');
          if (audioContext.state === 'closed') {
            throw new Error('Audio context was closed during module load');
          }
          processor = new AudioWorkletNode(audioContext, 'audio-processor', {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            outputChannelCount: [1]
          });
          processorReady = true;
          debugLog('✓ AudioWorkletNode initialized as primary');

          processor.port.onmessage = (event) => {
            if (isStoppingRef.current) {
              return;
            }
            
            if (event.data.type === 'audio') {
              audioChunkCount++;
              const audioData = new Float32Array(event.data.data);
              const resampledInt16 = resamplerRef.current.resampleToInt16(audioData);

              const now = Date.now();
              if (now - lastLevelUpdateRef.current > 60) {
                lastLevelUpdateRef.current = now;
                let sumSquares = 0;
                for (let i = 0; i < audioData.length; i++) {
                  sumSquares += audioData[i] * audioData[i];
                }
                const rms = Math.sqrt(sumSquares / audioData.length);
                const normalized = Math.min(1, rms * 4);
                setAudioLevel(normalized);
              }
              
              if (audioChunkCount === 1) {
                debugLog(`🔊 FIRST AUDIO CHUNK RECEIVED (AudioWorklet)! size=${resampledInt16.length}`);
              }
              
              if (audioChunkCount % 10 === 0) {
                debugLog(`📤 Chunk #${audioChunkCount} (AudioWorklet): resampled to 16kHz, size=${resampledInt16.length}`);
              }
              streamServiceRef.current.sendAudio(resampledInt16.buffer);
            }
          };

          gainNode.connect(processor);
          debugLog('✓ gainNode connected to AudioWorkletNode');
          
          // Connect AudioWorklet output to destination
          processor.connect(audioContext.destination);
          debugLog('✓ AudioWorkletNode connected to destination');
        } catch (err) {
          debugLog('AudioWorklet failed, falling back to ScriptProcessor:', err.message);
          processorReady = false;
        }
      }

      // Fallback to ScriptProcessor if AudioWorklet is unavailable or fails
      if (!processorReady && audioContext.state !== 'closed') {
        try {
          processor = audioContext.createScriptProcessor(
            AUDIO_CONFIG.BUFFER_SIZE,
            1,
            1
          );
          processorReady = true;
          debugLog('✓ ScriptProcessorNode initialized as fallback');

          processor.onaudioprocess = (event) => {
            if (isStoppingRef.current) {
              return;
            }
            
            audioChunkCount++;
            const audioData = event.inputBuffer.getChannelData(0);
            
            // Analyze audio quality before resampling
            let maxSample = 0, minSample = 0, sumSquares = 0;
            for (let i = 0; i < audioData.length; i++) {
              const val = Math.abs(audioData[i]);
              maxSample = Math.max(maxSample, val);
              minSample = Math.min(minSample, audioData[i]);
              sumSquares += audioData[i] * audioData[i];
            }
            const rms = Math.sqrt(sumSquares / audioData.length);

            const now = Date.now();
            if (now - lastLevelUpdateRef.current > 60) {
              lastLevelUpdateRef.current = now;
              const normalized = Math.min(1, rms * 4);
              setAudioLevel(normalized);
            }
            
            // Audio is already amplified by gainNode (3.0x) before reaching processor
            // No need to apply gain again - just resample to 16kHz for Deepgram
            const resampledInt16 = resamplerRef.current.resampleToInt16(audioData);
            
            if (audioChunkCount === 1) {
              debugLog(`🔊 FIRST AUDIO CHUNK RECEIVED! max=${maxSample.toFixed(6)} rms=${rms.toFixed(6)}`);
            }
            
            if (audioChunkCount % 10 === 0) {
              debugLog(`📤 Chunk #${audioChunkCount}: max=${maxSample.toFixed(4)} rms=${rms.toFixed(4)} (48kHz→16kHz, ${resampledInt16.length} samples)`);
            }
            streamServiceRef.current.sendAudio(resampledInt16.buffer);
          };

          gainNode.connect(processor);
          debugLog('✓ gainNode connected to ScriptProcessor');
          
          // Connect processor output to destination so onaudioprocess fires
          processor.connect(audioContext.destination);
          debugLog('✓ ScriptProcessor connected to destination');
        } catch (err) {
          console.error('❌ ScriptProcessor failed:', err.message);
          throw new Error('No audio processor available: ' + err.message);
        }
      }

      if (!processorReady) {
        throw new Error('Failed to initialize audio processor');
      }

      processorRef.current = processor;

      streamServiceRef.current.onMessage = (data) => {
        if (onTranscript) {
          onTranscript(data);
        }
        // Track if we received a transcript (interim or final)
        if (data.event === 'interim_transcript' || data.event === 'final_transcript') {
          transcriptReceivedRef.current = true;
        }
      };

      streamServiceRef.current.onError = (err) => {
        setError(err.message);
        setIsRecording(false);
      };

      // Always connect with 16kHz since we resample to that on client
      debugLog('🔗 Connecting to audio stream with:', { apiKey: apiKey ? '***' : 'MISSING', model, language, sampleRate: 16000 });
      await streamServiceRef.current.connect(apiKey, model, language, 16000);
    } catch (err) {
      setError(err.message);
      setIsRecording(false);
      setAudioLevel(0);
    }
  }, [onTranscript]);

  const stopRecording = useCallback(async () => {
    return new Promise((resolve) => {
      try {
        debugLog('⏹️ Stop recording called');
        
        // Reset resampler
        if (resamplerRef.current) {
          resamplerRef.current.reset();
        }
        
        // Set flag after small delay to allow initial audio to start flowing
        // This prevents races where stop is called before AudioWorklet connects
        setTimeout(() => {
          isStoppingRef.current = true;
          debugLog('🛑 Stop flag set - halting new audio chunks');
        }, 200);  // 200ms delay to let initial audio chunk through
        
        // Stop sending NEW audio to Deepgram, but allow buffered audio to flush
        streamServiceRef.current.stop();

        // Unmute audio
        AudioMuterService.unmute();

        // Stop media stream immediately
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(track => track.stop());
          mediaStreamRef.current = null;
        }

        // Stop audio processing
        if (processorRef.current) {
          try {
            processorRef.current.disconnect();
          } catch (err) {
            // Already disconnected, continue
          }
          processorRef.current = null;
        }

        // Disconnect gain node
        if (gainNodeRef.current) {
          try {
            gainNodeRef.current.disconnect();
          } catch (err) {
            // Already disconnected
          }
          gainNodeRef.current = null;
        }

        setIsRecording(false);
        setAudioLevel(0);

        // DO NOT close audio context immediately!
        // Wait for Deepgram response before closing
        // Max wait: 10 seconds for response (should be much faster normally)
        const maxWait = 10000;  // 10 seconds instead of 20
        const timeoutId = setTimeout(() => {
          if (DEBUG) console.warn('⏱️ Deepgram response timeout after 10s, forcing cleanup');
          cleanupAudioContext();
          try {
            streamServiceRef.current.disconnect();
          } catch (err) {
            console.warn('Error on timeout disconnect:', err);
          }
          resolve();
        }, maxWait);

        // Set up message handler to disconnect when we get response
        const originalOnMessage = streamServiceRef.current.onMessage;
        streamServiceRef.current.onMessage = (data) => {
          // Call original handler first
          if (originalOnMessage) {
            originalOnMessage(data);
          }
          
          // Handle error event
          if (data.event === 'error') {
            debugLog('🔴 Deepgram error received, cleaning up');
            clearTimeout(timeoutId);
            cleanupAudioContext();
            setTimeout(() => {
              try {
                streamServiceRef.current.disconnect();
                streamServiceRef.current.onMessage = originalOnMessage;
              } catch (err) {
                console.warn('Error disconnecting after error:', err);
              }
              debugLog('✅ stopRecording cleanup complete (after error)');
              resolve();
            }, 300);
            return;
          }
          
          // After receiving final transcript, do cleanup
          if (data.event === 'final_transcript' || data.isFinal) {
            debugLog('✅ Final transcript received, cleaning up');
            clearTimeout(timeoutId);
            cleanupAudioContext();
            setTimeout(() => {
              try {
                streamServiceRef.current.disconnect();
                streamServiceRef.current.onMessage = originalOnMessage;
              } catch (err) {
                console.warn('Error disconnecting:', err);
              }
              debugLog('✅ stopRecording cleanup complete');
              resolve();
            }, 300);
          }
        };
      } catch (err) {
        console.error('Error in stopRecording:', err);
        cleanupAudioContext();
        setIsRecording(false);
        setAudioLevel(0);
        resolve();
      }
    });
  }, []);

  // Helper function to safely close audio context
  const cleanupAudioContext = useCallback(() => {
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        debugLog('Closing audio context');
        audioContextRef.current.close();
      } catch (err) {
        console.warn('Error closing AudioContext:', err);
      } finally {
        audioContextRef.current = null;
      }
    }
  }, []);

  return {
    isRecording,
    error,
    startRecording,
    stopRecording,
    audioLevel
  };
};
