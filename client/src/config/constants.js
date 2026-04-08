export const HOTKEY_OPTIONS = [
  { value: 'rightOption', label: 'Right Option' },
  { value: 'leftOption', label: 'Left Option' },
  { value: 'rightCommand', label: 'Right Command' },
  { value: 'leftCommand', label: 'Left Command' },
  { value: 'fn', label: 'Fn' }
];

export const RECORDING_STATES = {
  IDLE: 'idle',
  RECORDING: 'recording',
  TRANSCRIBING: 'transcribing',
  ERROR: 'error'
};

export const CODE_MIX_LANGUAGES = {
  hinglish: 'Hinglish (Hindi-English)',
  tanglish: 'Tanglish (Tamil-English)',
  spanglish: 'Spanglish (Spanish-English)',
  franglais: 'Franglais (French-English)',
  denglish: 'Denglish (German-English)',
  jinglish: 'Jinglish (Japanese-English)',
  konglish: 'Konglish (Korean-English)',
  chinglish: 'Chinglish (Chinese-English)',
  singlish: 'Singlish (Singapore English)',
  manglish: 'Manglish (Malay-English)',
  taglish: 'Taglish (Tagalog-English)',
  benglish: 'Benglish (Bengali-English)',
  punglish: 'Punglish (Punjabi-English)',
  telugish: 'Telugish (Telugu-English)',
  kanglish: 'Kanglish (Kannada-English)',
  malaglish: 'Malaglish (Marathi-English)'
};

export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'hi', name: 'Hindi' },
  { code: 'pl', name: 'Polish' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'it', name: 'Italian' }
];

export const AUDIO_CONFIG = {
  SAMPLE_RATE: 16000,
  CHANNELS: 1,
  BIT_DEPTH: 16,
  BUFFER_SIZE: 4096
};
