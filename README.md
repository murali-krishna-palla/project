# VocalFlow Web

Voice-first transcription web app with live capture, Deepgram STT, optional Groq post-processing, and a clean settings-driven workflow.

## Features
- Hotkey-based recording (press to start, release to stop).
- Microphone test before recording with a visible countdown.
- Selectable microphone device in Settings.
- Live waveform overlay and recording status.
- Deepgram streaming transcription with interim and final results.
- Optional Groq post-processing (spelling, grammar, code-mix, translation).
- Transcript actions: copy to clipboard and manual save to history.
- Recording history with search, timestamps, and delete.
- Secure settings with encrypted API keys in the database.

## Apps
- client: React UI
- server: Node/Express API + WebSocket proxy to Deepgram

## Quick Start
1) Install dependencies
   - client: npm install
   - server: npm install

2) Configure environment
   - server/.env should include:
     - MONGODB_URI
     - JWT_SECRET
     - ENCRYPTION_KEY

3) Run
   - server: npm start
   - client: npm start

## Notes
- Microphone access is required. If input is silent, choose a device in Settings.
- Deepgram API key is required for transcription.
- Groq API key is optional for post-processing.
