import React, { useEffect, useRef } from 'react';
import '../styles/WaveformOverlay.css';

/**
 * Real-time Waveform Visualization Component
 * Displays live audio waveform during recording
 * Mirrors the desktop app's RecordingOverlayController
 */
const WaveformOverlay = ({ isActive, audioLevel = 0, analyser = null }) => {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    if (!isActive || !canvasRef.current || !analyser) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const draw = () => {
      analyser.getByteFrequencyData(dataArray);

      // Clear canvas with semi-transparent background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, rect.width, rect.height);

      // Draw waveform
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#00ff00';
      ctx.beginPath();

      const sliceWidth = rect.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * rect.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(rect.width, rect.height / 2);
      ctx.stroke();

      // Continue animation
      if (isActive) {
        animationFrameRef.current = requestAnimationFrame(draw);
      }
    };

    // Start animation
    animationFrameRef.current = requestAnimationFrame(draw);

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, analyser]);

  // Fallback: Animated bars when analyser not available
  return (
    <div className={`waveform-overlay ${isActive ? 'active' : ''}`}>
      {analyser ? (
        <canvas ref={canvasRef} className="waveform-canvas"></canvas>
      ) : (
        <>
          <div className="bar bar-1" style={{ animationDelay: '0s' }}></div>
          <div className="bar bar-2" style={{ animationDelay: '0.08s' }}></div>
          <div className="bar bar-3" style={{ animationDelay: '0.16s' }}></div>
          <div className="bar bar-4" style={{ animationDelay: '0.24s' }}></div>
          <div className="bar bar-5" style={{ animationDelay: '0.32s' }}></div>
          <div className="bar bar-6" style={{ animationDelay: '0.40s' }}></div>
        </>
      )}
    </div>
  );
};

export default WaveformOverlay;
