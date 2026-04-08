import React from 'react';
import { RECORDING_STATES } from '../config/constants';
import '../styles/MenuBar.css';

/**
 * Presentation Layer - Menu Bar Component
 */
const MenuBar = ({ recordingState, onOpenSettings }) => {
  const getIcon = () => {
    switch (recordingState) {
      case RECORDING_STATES.RECORDING:
        return '🎙️';
      case RECORDING_STATES.TRANSCRIBING:
        return '⏳';
      case RECORDING_STATES.ERROR:
        return '⚠️';
      default:
        return '🎤';
    }
  };

  return (
    <div className="menu-bar">
      <div className="menu-icon">{getIcon()}</div>
      <div className="menu-status">
        {recordingState === RECORDING_STATES.IDLE && 'Ready'}
        {recordingState === RECORDING_STATES.RECORDING && 'Recording...'}
        {recordingState === RECORDING_STATES.TRANSCRIBING && 'Transcribing...'}
        {recordingState === RECORDING_STATES.ERROR && 'Error'}
      </div>
      <button onClick={onOpenSettings} className="menu-btn">
        ⚙️ Settings
      </button>
    </div>
  );
};

export default MenuBar;
