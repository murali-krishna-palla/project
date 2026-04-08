import React from 'react';
import { RECORDING_STATES } from '../config/constants';
import '../styles/MenuBar.css';

/**
 * Presentation Layer - Menu Bar Component
 */
const MenuBar = ({ recordingState, onOpenSettings, onLogout }) => {
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
      <div className="menu-left">
        <div className="menu-icon">{getIcon()}</div>
        <div className="menu-status">
          {recordingState === RECORDING_STATES.IDLE && 'Ready'}
          {recordingState === RECORDING_STATES.RECORDING && 'Recording...'}
          {recordingState === RECORDING_STATES.TRANSCRIBING && 'Transcribing...'}
          {recordingState === RECORDING_STATES.ERROR && 'Error'}
        </div>
      </div>
      
      <div className="menu-right">
        <button onClick={onOpenSettings} className="menu-btn" title="Settings">
          ⚙️ Settings
        </button>
        <button 
          onClick={() => {
            console.log('🚪 MenuBar: Logout button clicked');
            console.log('  onLogout type:', typeof onLogout);
            console.log('  onLogout value:', onLogout ? 'function' : 'undefined');
            if (onLogout) {
              console.log('  🚪 Calling onLogout...');
              onLogout();
            } else {
              console.error('  ❌ ERROR: onLogout is undefined!');
            }
          }} 
          className="menu-btn logout-btn" 
          title="Logout"
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
};

export default MenuBar;
