import { API_ENDPOINTS } from '../config/api';

/**
 * Data Access Layer - API Service for Settings
 */
class SettingsAPIService {
  static async getSettings(userId) {
    const response = await fetch(API_ENDPOINTS.SETTINGS(userId));
    if (!response.ok) throw new Error('Failed to fetch settings');
    return response.json();
  }

  static async updateSettings(userId, settings) {
    const response = await fetch(API_ENDPOINTS.SETTINGS(userId), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (!response.ok) throw new Error('Failed to update settings');
    return response.json();
  }

  static async fetchDeepgramModels(apiKey) {
    const response = await fetch(API_ENDPOINTS.DEEPGRAM_MODELS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey })
    });
    if (!response.ok) throw new Error('Failed to fetch Deepgram models');
    return response.json();
  }

  static async fetchGroqModels(apiKey) {
    const response = await fetch(API_ENDPOINTS.GROQ_MODELS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey })
    });
    if (!response.ok) throw new Error('Failed to fetch Groq models');
    return response.json();
  }

  static async getDeepgramBalance(apiKey) {
    const response = await fetch(API_ENDPOINTS.DEEPGRAM_BALANCE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey })
    });
    if (!response.ok) throw new Error('Failed to fetch Deepgram balance');
    return response.json();
  }

  static async getGroqBalance(apiKey) {
    const response = await fetch(API_ENDPOINTS.GROQ_BALANCE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey })
    });
    if (!response.ok) throw new Error('Failed to fetch Groq balance');
    return response.json();
  }
}

export default SettingsAPIService;
