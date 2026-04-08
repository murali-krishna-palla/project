import React, { useState, useEffect } from 'react';
import RecordingAPIService from '../services/recordingAPI';
import '../styles/RecordingsList.css';

/**
 * Presentation Layer - Recordings List Component
 */
const RecordingsList = ({ userId, refreshKey = 0 }) => {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadRecordings = async () => {
      try {
        setLoading(true);
        const response = await RecordingAPIService.getRecordings(userId);
        const recordingsData =
          response.recordings ||
          response.data?.recordings ||
          response.data ||
          [];
        setRecordings(recordingsData);
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
  }, [userId, refreshKey]);

  const handleDelete = async (recordingId) => {
    try {
      await RecordingAPIService.deleteRecording(userId, recordingId);
      setRecordings(recordings.filter(r => r._id !== recordingId));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="recordings-list">Loading...</div>;

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredRecordings = normalizedSearch
    ? recordings.filter((recording) => {
        const original = recording.originalTranscript?.toLowerCase() || '';
        const processed = recording.processedTranscript?.toLowerCase() || '';
        return original.includes(normalizedSearch) || processed.includes(normalizedSearch);
      })
    : recordings;

  return (
    <div className="recordings-list">
      <h3>Recording History</h3>
      {error && <div className="error-message">{error}</div>}

      <div className="recordings-toolbar">
        <input
          type="text"
          placeholder="Search transcripts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <span className="recordings-count">{filteredRecordings.length} items</span>
      </div>

      {filteredRecordings.length === 0 ? (
        <p className="no-recordings">
          {recordings.length === 0 ? 'No recordings yet' : 'No matches found'}
        </p>
      ) : (
        <ul>
          {filteredRecordings.map((recording) => (
            <li key={recording._id} className="recording-item">
              <div className="recording-content">
                <p className="original">{recording.originalTranscript}</p>
                {recording.processedTranscript && (
                  <p className="processed">{recording.processedTranscript}</p>
                )}
                <small>
                  {new Date(recording.createdAt).toLocaleString()} • {Math.round((recording.duration || 0) / 1000)}s
                </small>
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
