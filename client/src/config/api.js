const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const API_PREFIX = `${API_BASE_URL}/api`;
const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:5000/ws';

export { API_BASE_URL };

export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_PREFIX}/auth/login`,
  REGISTER: `${API_PREFIX}/auth/register`,
  VALIDATE: `${API_PREFIX}/auth/validate`,

  // Settings
  SETTINGS: (userId) => `${API_PREFIX}/settings/${userId}`,
  DEEPGRAM_MODELS: `${API_PREFIX}/settings/models/deepgram`,
  GROQ_MODELS: `${API_PREFIX}/settings/models/groq`,
  DEEPGRAM_BALANCE: `${API_PREFIX}/settings/balance/deepgram`,
  GROQ_BALANCE: `${API_PREFIX}/settings/balance/groq`,

  // Recordings
  RECORDINGS: (userId) => `${API_PREFIX}/recordings/${userId}`,
  RECORDING: (userId, recordingId) => `${API_PREFIX}/recordings/${userId}/${recordingId}`,

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
