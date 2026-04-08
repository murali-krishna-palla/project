module.exports = {
  // Audio Config
  AUDIO: {
    SAMPLE_RATE: 16000,
    CHANNELS: 1,
    BIT_DEPTH: 16,
    ENCODING: 'linear16' // raw PCM, not WAV
  },

  // Deepgram
  DEEPGRAM: {
    API_URL: 'https://api.deepgram.com/v1',
    WS_URL: 'wss://api.deepgram.com/v1/listen',
    DEFAULT_MODEL: 'nova-2-general',
    DEFAULT_LANGUAGE: 'en'
  },

  // Groq
  GROQ: {
    API_URL: 'https://api.groq.com/openai/v1',
    DEFAULT_MODEL: 'mixtral-8x7b-32768',
    TEMPERATURE: 0
  },

  // Code-Mix Languages (16 types - exactly matching vocal/vocalflow macOS version)
  CODE_MIX_LANGUAGES: {
    'Hinglish': 'Hindi + English',
    'Tanglish': 'Tamil + English',
    'Benglish': 'Bengali + English',
    'Kanglish': 'Kannada + English',
    'Tenglish': 'Telugu + English',
    'Minglish': 'Marathi + English',
    'Punglish': 'Punjabi + English',
    'Spanglish': 'Spanish + English',
    'Franglais': 'French + English',
    'Portuñol': 'Portuguese + Spanish',
    'Chinglish': 'Chinese + English',
    'Japlish': 'Japanese + English',
    'Konglish': 'Korean + English',
    'Arabizi': 'Arabic + English',
    'Sheng': 'Swahili + English',
    'Camfranglais': 'French + English + local languages'
  },

  // Recording States
  RECORDING_STATES: {
    IDLE: 'idle',
    RECORDING: 'recording',
    TRANSCRIBING: 'transcribing',
    ERROR: 'error'
  }
};
