import { API_ENDPOINTS } from '../config/api';

/**
 * Data Access Layer - API Service for Recordings
 */
class RecordingAPIService {
  static async getRecordings(userId, limit = 20, skip = 0) {
    const url = new URL(API_ENDPOINTS.RECORDINGS(userId));
    url.searchParams.append('limit', limit);
    url.searchParams.append('skip', skip);

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Failed to fetch recordings');
    return response.json();
  }

  static async saveRecording(userId, recordingData) {
    const response = await fetch(API_ENDPOINTS.RECORDINGS(userId), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recordingData)
    });
    if (!response.ok) throw new Error('Failed to save recording');
    return response.json();
  }

  static async deleteRecording(userId, recordingId) {
    const response = await fetch(API_ENDPOINTS.RECORDING(userId, recordingId), {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete recording');
    return response.json();
  }
}

export default RecordingAPIService;
