export const HOTKEY_OPTIONS = [
  { value: 'rightOption', label: 'Right Option' },
  { value: 'leftOption', label: 'Left Option' },
  { value: 'rightCommand', label: 'Right Command' },
  { value: 'leftCommand', label: 'Left Command' },
  { value: 'fn', label: 'Fn' }
];

export const RECORDING_STATES = {
  IDLE: 'idle',
  TESTING: 'testing',
  RECORDING: 'recording',
  TRANSCRIBING: 'transcribing',
  ERROR: 'error'
};

export const CODE_MIX_LANGUAGES = {
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
};

export const LANGUAGES = [
  // Pure languages
  'English', 'Hindi', 'Spanish', 'French', 'German',
  'Portuguese', 'Japanese', 'Korean', 'Arabic', 'Bengali',
  'Tamil', 'Telugu', 'Kannada', 'Marathi', 'Punjabi',
  'Russian', 'Chinese (Simplified)', 'Italian', 'Dutch', 'Swahili',
  // Mixed / code-switch styles from vocal
  'Hinglish', 'Tanglish', 'Benglish', 'Kanglish', 'Tenglish',
  'Minglish', 'Punglish', 'Spanglish', 'Franglais', 'Portuñol',
  'Chinglish', 'Japlish', 'Konglish', 'Arabizi', 'Sheng', 'Camfranglais'
];

export const AUDIO_CONFIG = {
  SAMPLE_RATE: 16000,
  CHANNELS: 1,
  BIT_DEPTH: 16,
  BUFFER_SIZE: 4096
};
