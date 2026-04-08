import React, { useState, useEffect } from 'react';
import RecordingAPIService from '../services/recordingAPI';
import '../styles/RecordingsList.css';

/**
 * Presentation Layer - Recordings List Component
 */
const RecordingsList = ({ userId }) => {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadRecordings = async () => {
      try {
        const data = await RecordingAPIService.getRecordings(userId);
        setRecordings(data.recordings || []);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadRecordings();
    }
  }, [userId]);

  const handleDelete = async (recordingId) => {
    try {
      await RecordingAPIService.deleteRecording(userId, recordingId);
      setRecordings(recordings.filter(r => r._id !== recordingId));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="recordings-list">Loading...</div>;

  return (
    <div className="recordings-list">
      <h3>Recording History</h3>
      {error && <div className="error-message">{error}</div>}

      {recordings.length === 0 ? (
        <p className="no-recordings">No recordings yet</p>
      ) : (
        <ul>
          {recordings.map((recording) => (
            <li key={recording._id} className="recording-item">
              <div className="recording-content">
                <p className="original">{recording.originalTranscript}</p>
                {recording.processedTranscript && (
                  <p className="processed">{recording.processedTranscript}</p>
                )}
                <small>{new Date(recording.createdAt).toLocaleString()}</small>
              </div>
              <button onClick={() => handleDelete(recording._id)} className="delete-btn">
                🗑️
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RecordingsList;
