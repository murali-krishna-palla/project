import { API_ENDPOINTS } from '../config/api';
import AuthService from './authAPI';

/**
 * Data Access Layer - API Service for Recordings
 */
class RecordingAPIService {
  static getAuthHeaders() {
    return AuthService.getAuthHeader();
  }

  static async getRecordings(userId, limit = 20, skip = 0) {
    const url = new URL(API_ENDPOINTS.RECORDINGS(userId));
    url.searchParams.append('limit', limit);
    url.searchParams.append('skip', skip);

    const response = await fetch(url.toString(), {
      headers: this.getAuthHeaders()
    });
    if (!response.ok) {
      let message = 'Failed to fetch recordings';
      try {
        const data = await response.json();
        message = data.message || data.error || message;
      } catch (err) {
        // ignore JSON parsing errors
      }
      throw new Error(message);
    }
    return response.json();
  }

  static async saveRecording(userId, recordingData) {
    const response = await fetch(API_ENDPOINTS.RECORDINGS(userId), {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(recordingData)
    });
    if (!response.ok) {
      let message = 'Failed to save recording';
      try {
        const data = await response.json();
        message = data.message || data.error || message;
      } catch (err) {
        // ignore JSON parsing errors
      }
      throw new Error(message);
    }
    return response.json();
  }

  static async deleteRecording(userId, recordingId) {
    const response = await fetch(API_ENDPOINTS.RECORDING(userId, recordingId), {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    if (!response.ok) {
      let message = 'Failed to delete recording';
      try {
        const data = await response.json();
        message = data.message || data.error || message;
      } catch (err) {
        // ignore JSON parsing errors
      }
      throw new Error(message);
    }
    return response.json();
  }
}

export default RecordingAPIService;
