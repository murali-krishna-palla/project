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

  // Code-Mix Languages
  CODE_MIX_LANGUAGES: {
    hinglish: 'Hindi-English Code-Mix (Roman Script)',
    tanglish: 'Tamil-English Code-Mix (Roman Script)',
    spanglish: 'Spanish-English Code-Mix',
    franglais: 'French-English Code-Mix',
    denglish: 'German-English Code-Mix',
    jinglish: 'Japanese-English Code-Mix',
    konglish: 'Korean-English Code-Mix',
    chinglish: 'Chinese-English Code-Mix',
    singlish: 'Singaporean English',
    manglish: 'Malay-English Code-Mix',
    taglish: 'Tagalog-English Code-Mix',
    benglish: 'Bengali-English Code-Mix',
    punglish: 'Punjabi-English Code-Mix',
    telugish: 'Telugu-English Code-Mix',
    kanglish: 'Kannada-English Code-Mix',
    malaglish: 'Marathi-English Code-Mix'
  },

  // Recording States
  RECORDING_STATES: {
    IDLE: 'idle',
    RECORDING: 'recording',
    TRANSCRIBING: 'transcribing',
    ERROR: 'error'
  }
};
