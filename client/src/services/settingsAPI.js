import { API_ENDPOINTS } from '../config/api';
import AuthService from './authAPI';

/**
 * Data Access Layer - API Service for Settings
 */
class SettingsAPIService {
  static getAuthHeaders() {
    return AuthService.getAuthHeader();
  }

  static async getSettings(userId) {
    const response = await fetch(API_ENDPOINTS.SETTINGS(userId), {
      headers: this.getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch settings');
    return response.json();
  }

  static async updateSettings(userId, settings) {
    const response = await fetch(API_ENDPOINTS.SETTINGS(userId), {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(settings)
    });
    if (!response.ok) throw new Error('Failed to update settings');
    return response.json();
  }

  static async fetchDeepgramModels(apiKey) {
    const response = await fetch(API_ENDPOINTS.DEEPGRAM_MODELS, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ apiKey })
    });
    if (!response.ok) throw new Error('Failed to fetch Deepgram models');
    return response.json();
  }

  static async fetchGroqModels(apiKey) {
    const response = await fetch(API_ENDPOINTS.GROQ_MODELS, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ apiKey })
    });
    if (!response.ok) throw new Error('Failed to fetch Groq models');
    return response.json();
  }

  static async getDeepgramBalance(apiKey) {
    const response = await fetch(API_ENDPOINTS.DEEPGRAM_BALANCE, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ apiKey })
    });
    if (!response.ok) throw new Error('Failed to fetch Deepgram balance');
    return response.json();
  }

  static async getGroqBalance(apiKey) {
    const response = await fetch(API_ENDPOINTS.GROQ_BALANCE, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ apiKey })
    });
    if (!response.ok) throw new Error('Failed to fetch Groq balance');
    return response.json();
  }
}

export default SettingsAPIService;
