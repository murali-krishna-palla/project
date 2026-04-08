const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:5000/ws';

export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,

  // Settings
  SETTINGS: (userId) => `${API_BASE_URL}/settings/${userId}`,
  DEEPGRAM_MODELS: `${API_BASE_URL}/settings/models/deepgram`,
  GROQ_MODELS: `${API_BASE_URL}/settings/models/groq`,
  DEEPGRAM_BALANCE: `${API_BASE_URL}/settings/balance/deepgram`,
  GROQ_BALANCE: `${API_BASE_URL}/settings/balance/groq`,

  // Recordings
  RECORDINGS: (userId) => `${API_BASE_URL}/recordings/${userId}`,
  RECORDING: (userId, recordingId) => `${API_BASE_URL}/recordings/${userId}/${recordingId}`,

  // WebSocket
  AUDIO_WS: `${WS_URL}/audio`
};

export const DEEPGRAM_WS_PARAMS = {
  encoding: 'linear16',
  sample_rate: 16000,
  channels: 1,
  punctuate: true,
  interim_results: true
};
