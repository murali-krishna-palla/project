import React, { useState } from 'react';
import TextInjectorService from '../services/textInjector';
import '../styles/TranscriptDisplay.css';

/**
 * Presentation Layer - Transcript Display Component
 */
const TranscriptDisplay = ({ interim, final, isProcessing, onSave, saveStatus, isSaving }) => {
  const [copyStatus, setCopyStatus] = useState(null);

  const handleCopyToClipboard = async (text) => {
    if (!text) return;
    await TextInjectorService.injectText(
      text,
      (msg) => {
        setCopyStatus(msg);
        setTimeout(() => setCopyStatus(null), 3000);
      },
      (err) => {
        setCopyStatus(`Error: ${err}`);
        setTimeout(() => setCopyStatus(null), 3000);
      }
    );
  };
  return (
    <div className="transcript-display">
      <div className="transcript-section">
        <h3>Live Transcript</h3>
        <div className="transcript-box interim">
          {interim || <span className="placeholder">Listening...</span>}
        </div>
      </div>

      {final && (
        <div className="transcript-section">
          <h3>Final Transcript</h3>
          <div className="transcript-box final">
            {final}
          </div>
          <div className="transcript-actions">
            <button className="copy-button" onClick={() => handleCopyToClipboard(final)}>
              📋 Copy to Clipboard
            </button>
            <button
              className="save-button"
              onClick={() => onSave?.(final)}
              disabled={isSaving}
            >
              {isSaving ? '⏳ Saving...' : '💾 Save to History'}
            </button>
          </div>
        </div>
      )}

      {copyStatus && (
        <div className="copy-status">
          {copyStatus}
        </div>
      )}

      {saveStatus && (
        <div className="save-status">
          {saveStatus}
        </div>
      )}

      {isProcessing && (
        <div className="processing-indicator">
          ⏳ Processing...
        </div>
      )}
    </div>
  );
};

export default TranscriptDisplay;
