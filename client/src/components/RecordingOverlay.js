import React, { useEffect } from 'react';
import { RECORDING_STATES } from '../config/constants';
import '../styles/RecordingOverlay.css';

/**
 * Presentation Layer - Recording Overlay Component
 */
const RecordingOverlay = ({ isVisible, recordingState, onStop }) => {
  if (!isVisible || recordingState === RECORDING_STATES.IDLE) {
    return null;
  }

  return (
    <div className={`recording-overlay ${recordingState}`}>
      <div className="waveform">
        <div className="bar"></div>
        <div className="bar"></div>
        <div className="bar"></div>
        <div className="bar"></div>
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
    </div>
  );
};

export default RecordingOverlay;
