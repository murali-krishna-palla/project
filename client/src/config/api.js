const DEFAULT_API_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://project-1-ofre.onrender.com'
    : 'http://localhost:5000';

const DEFAULT_WS_URL =
  process.env.NODE_ENV === 'production'
    ? 'wss://project-1-ofre.onrender.com/ws'
    : 'ws://localhost:5000/ws';

const API_BASE_URL = process.env.REACT_APP_API_URL || DEFAULT_API_BASE_URL;
const API_PREFIX = `${API_BASE_URL}/api`;
const WS_URL = process.env.REACT_APP_WS_URL || DEFAULT_WS_URL;

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
