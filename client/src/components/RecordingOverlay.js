import React from 'react';
import { RECORDING_STATES } from '../config/constants';
import '../styles/RecordingOverlay.css';

/**
 * Presentation Layer - Recording Overlay Component
 */
const RecordingOverlay = ({
  isVisible,
  recordingState,
  audioLevel = 0,
  micTestSecondsLeft = 0,
  onStop
}) => {
  if (!isVisible || recordingState === RECORDING_STATES.IDLE) {
    return null;
  }

  const clampedLevel = Math.max(0, Math.min(1, audioLevel));
  const barScales = [0.7, 1.0, 0.85, 0.6];

  return (
    <div className={`recording-overlay ${recordingState}`}>
      <div className="waveform">
        {barScales.map((scale, index) => {
          const height = 6 + clampedLevel * 28 * scale;
          return (
            <div
              key={`bar-${index}`}
              className="bar"
              style={{ height: `${height}px` }}
            ></div>
          );
        })}
      </div>
      
      {recordingState === RECORDING_STATES.RECORDING && onStop && (
        <button className="stop-button" onClick={onStop} title="Stop recording">
          ⏹️ Stop
        </button>
      )}
      
      {recordingState === RECORDING_STATES.TRANSCRIBING && (
        <div className="transcribing-status">
          ⏳ Transcribing...
        </div>
      )}

      {recordingState === RECORDING_STATES.TESTING && (
        <div className="testing-status">
          🎙️ Testing microphone{micTestSecondsLeft > 0 ? `... ${micTestSecondsLeft}s` : '...'}
        </div>
      )}
    </div>
  );
};

export default RecordingOverlay;
