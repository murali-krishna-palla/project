import React from 'react';
import '../styles/WaveformOverlay.css';

/**
 * Presentation Layer - Waveform Visualization Component
 */
const WaveformOverlay = ({ isActive }) => {
  return (
    <div className={`waveform-overlay ${isActive ? 'active' : ''}`}>
      <div className="bar bar-1"></div>
      <div className="bar bar-2"></div>
      <div className="bar bar-3"></div>
      <div className="bar bar-4"></div>
    </div>
  );
};

export default WaveformOverlay;
