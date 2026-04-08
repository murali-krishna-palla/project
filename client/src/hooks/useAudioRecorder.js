import { useState, useCallback, useRef } from 'react';
import { AUDIO_CONFIG } from '../config/constants';
import AudioStreamService from '../services/audioStream';
import AudioMuterService from '../services/audioMuter';

/**
 * Business Logic Layer - Hook for Audio Recording
 */
export const useAudioRecorder = (onTranscript) => {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);

  const mediaStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const gainNodeRef = useRef(null);
  const streamServiceRef = useRef(new AudioStreamService());
  const startTimeRef = useRef(Date.now());
  const transcriptReceivedRef = useRef(false);  // Track if we got response from Deepgram
  const isStoppingRef = useRef(false);  // Flag to stop processing audio chunks

  const startRecording = useCallback(async (apiKey, model, language) => {
    try {
      setError(null);
      setIsRecording(true);
      startTimeRef.current = Date.now();

      // Request microphone access
      console.log('🎤 Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      // Check if microphone is actually active
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error('❌ No audio tracks available - check microphone connection');
      }
      console.log(`✓ Microphone obtained - ${audioTracks.length} audio track(s)`);
      console.log(`  Track enabled: ${audioTracks[0].enabled}`);
      console.log(`  Track state: ${audioTracks[0].readyState}`);
      console.log(`  Device ID: ${audioTracks[0].getSettings?.()?.deviceId ?? 'unknown'}`);

      // TEST MICROPHONE: Check if it's actually capturing audio
      console.log('🔍 Testing microphone for audio capture...');
      const testContext = new (window.AudioContext || window.webkitAudioContext)();
      const testSource = testContext.createMediaStreamSource(stream);
      const testAnalyser = testContext.createAnalyser();
      testAnalyser.fftSize = 2048;
      testSource.connect(testAnalyser);
      
      const dataArray = new Uint8Array(testAnalyser.frequencyBinCount);
      let silentFrames = 0;
      let detectedAudio = false;
      
      // Listen for 500ms
      const testInterval = setInterval(() => {
        testAnalyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        
        if (average < 5) {
          silentFrames++;
        } else {
          detectedAudio = true;
          console.log(`✓ Microphone TEST: Audio detected! Average level: ${average.toFixed(1)}`);
          clearInterval(testInterval);
        }
      }, 50);

      // Wait 500ms for test
      await new Promise(resolve => setTimeout(resolve, 500));
      clearInterval(testInterval);
      
      if (!detectedAudio) {
        console.warn('⚠️ Microphone TEST FAILED: Only silence detected');
        console.warn('💡 Troubleshooting:');
        console.warn('  1. Check if microphone is plugged in');
        console.warn('  2. Check Windows Sound Settings (right-click speaker icon)');
        console.warn('  3. Allow microphone access in browser settings');
        console.warn('  4. Try Google Meet or another app to verify microphone works');
        
        // Clean up test context
        testSource.disconnect();
        testContext.close();
        
        throw new Error('❌ Microphone test failed - no audio detected. Check microphone connection and permissions.');
      }
      
      // Clean up test context
      testSource.disconnect();
      testContext.close();

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
      console.log(`🎵 Browser audio context sample rate: ${audioContext.sampleRate}Hz`);

      // Initialize audio muter
      AudioMuterService.initialize(audioContext);
      AudioMuterService.mute(); // Mute output during recording

      // Setup audio processing with gain
      if (audioContext.state !== 'running' && audioContext.state !== 'suspended') {
        throw new Error('Audio context not in valid state');
      }
      
      const source = audioContext.createMediaStreamSource(stream);
      console.log('✓ Media stream source created');
      
      // Add gain node to amplify microphone signal (fixes low volume issue)
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 3.0; // 3x amplification for quiet microphones
      source.connect(gainNode);
      gainNodeRef.current = gainNode;
      console.log('🔊 Audio gain node initialized (3x amplification)');
      
      let processorReady = false;
      let processor;
      let audioChunkCount = 0;

      // Try AudioWorkletNode first (modern, no deprecation)
      if (audioContext.audioWorklet && audioContext.state !== 'closed') {
        try {
          await audioContext.audioWorklet.addModule('/audio-processor.js');
          if (audioContext.state === 'closed') {
            throw new Error('Audio context was closed during module load');
          }
          // Explicitly set to 1 input channel, 1 output channel (MONO)
          processor = new AudioWorkletNode(audioContext, 'audio-processor', {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            outputChannelCount: [1]
          });
          processorReady = true;
          console.log('✓ AudioWorkletNode initialized (mono)');

          processor.port.onmessage = (event) => {
            // Don't process audio chunks after stop() was called
            if (isStoppingRef.current) {
              console.log('🛑 Ignoring audio chunk - recording stopped');
              return;
            }
            
            if (event.data.type === 'audio') {
              audioChunkCount++;
              // IMPORTANT: Copy the data immediately - browser reuses this buffer!
              const audioData = new Float32Array(event.data.data);
              const wavData = new Int16Array(audioData.length);
              
              // Calculate audio magnitude to detect if it's silence
              let sum = 0;
              for (let i = 0; i < audioData.length; i++) {
                wavData[i] = audioData[i] < 0 ? audioData[i] * 0x8000 : audioData[i] * 0x7FFF;
                sum += Math.abs(audioData[i]);
              }
              const avgMagnitude = (sum / Math.max(1, audioData.length)).toFixed(4);
              
              if (audioChunkCount % 10 === 0) {
                console.log(`📤 Audio chunks sent: ${audioChunkCount} (avg magnitude: ${avgMagnitude})`);
              }
              streamServiceRef.current.sendAudio(wavData.buffer);
            }
          };

          gainNode.connect(processor);
          // DO NOT connect processor to destination during recording
          // This prevents microphone feedback/echo in speakers
          // processor.connect(audioContext.destination);
          
          // Instead, connect to the muter's gain node if we need speaker output later
          // But during recording, we want silence (mic audio → Deepgram only)
        } catch (err) {
          console.log('ℹ AudioWorkletNode failed, using ScriptProcessorNode:', err.message);
        }
      }

      // Fallback to ScriptProcessorNode if AudioWorklet unavailable
      if (!processorReady) {
        if (audioContext.state === 'closed') {
          throw new Error('Audio context is closed, cannot create ScriptProcessor');
        }
        processor = audioContext.createScriptProcessor(
          AUDIO_CONFIG.BUFFER_SIZE,
          1,
          1
        );
        console.log('✓ ScriptProcessorNode initialized (fallback)');

        processor.onaudioprocess = (event) => {
          // Don't process audio chunks after stop() was called
          if (isStoppingRef.current) {
            return;  // Silently ignore - ScriptProcessor can't do much else
          }
          
          audioChunkCount++;
          const audioData = event.inputBuffer.getChannelData(0);
          const wavData = new Int16Array(audioData.length);

          // Calculate audio magnitude to detect if it's silence
          // NOTE: Apply gain manually since ScriptProcessor might not reflect gainNode
          let sum = 0;
          for (let i = 0; i < audioData.length; i++) {
            // Apply gain: 3x amplification
            const amplified = audioData[i] * 3.0;
            // Clamp to prevent clipping
            const clamped = amplified > 1.0 ? 1.0 : (amplified < -1.0 ? -1.0 : amplified);
            wavData[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7FFF;
            sum += Math.abs(clamped);
          }
          const avgMagnitude = (sum / Math.max(1, audioData.length)).toFixed(4);
          
          if (audioChunkCount % 10 === 0) {
            console.log(`📤 Audio chunks sent: ${audioChunkCount} (avg magnitude: ${avgMagnitude})`);
          }
          streamServiceRef.current.sendAudio(wavData.buffer);
        };

        gainNode.connect(processor);
        // DO NOT connect processor to destination during recording
        // This prevents microphone feedback/echo in speakers
        // processor.connect(audioContext.destination);
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

      await streamServiceRef.current.connect(apiKey, model, language, audioContext.sampleRate);
    } catch (err) {
      setError(err.message);
      setIsRecording(false);
    }
  }, [onTranscript]);

  const stopRecording = useCallback(async () => {
    return new Promise((resolve) => {
      try {
        console.log('⏹️ Stop recording called');
        
        // Set flag after small delay to allow initial audio to start flowing
        // This prevents races where stop is called before AudioWorklet connects
        setTimeout(() => {
          isStoppingRef.current = true;
          console.log('🛑 Stop flag set - halting new audio chunks');
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

        // DO NOT close audio context immediately!
        // Wait for Deepgram response before closing
        // Max wait: 10 seconds for response (should be much faster normally)
        const maxWait = 10000;  // 10 seconds instead of 20
        const timeoutId = setTimeout(() => {
          console.warn('⏱️ Deepgram response timeout after 10s, forcing cleanup');
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
            console.log('🔴 Deepgram error received, cleaning up');
            clearTimeout(timeoutId);
            cleanupAudioContext();
            setTimeout(() => {
              try {
                streamServiceRef.current.disconnect();
                streamServiceRef.current.onMessage = originalOnMessage;
              } catch (err) {
                console.warn('Error disconnecting after error:', err);
              }
              console.log('✅ stopRecording cleanup complete (after error)');
              resolve();
            }, 300);
            return;
          }
          
          // After receiving final transcript, do cleanup
          if (data.event === 'final_transcript' || data.isFinal) {
            console.log('✅ Final transcript received, cleaning up');
            clearTimeout(timeoutId);
            cleanupAudioContext();
            setTimeout(() => {
              try {
                streamServiceRef.current.disconnect();
                streamServiceRef.current.onMessage = originalOnMessage;
              } catch (err) {
                console.warn('Error disconnecting:', err);
              }
              console.log('✅ stopRecording cleanup complete');
              resolve();
            }, 300);
          }
        };
      } catch (err) {
        console.error('Error in stopRecording:', err);
        cleanupAudioContext();
        setIsRecording(false);
        resolve();
      }
    });
  }, []);

  // Helper function to safely close audio context
  const cleanupAudioContext = useCallback(() => {
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        console.log('Closing audio context');
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
    stopRecording
  };
};
