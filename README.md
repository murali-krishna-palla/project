# VocalFlow - MERN Stack (Web Version)

A complete web-based voice-to-text transcription application built with the MERN stack (MongoDB, Express, React, Node.js). Clone of the native macOS VocalFlow app, now for browsers with full Windows compatibility.

## Project Structure

```
vocalflow-web/
├── server/                          # Backend (Node.js + Express)
│   ├── config/                      # Infrastructure Layer
│   │   ├── database.js
│   │   └── constants.js
│   ├── models/                      # Data Access Layer
│   │   ├── Settings.js
│   │   └── Recording.js
│   ├── services/                    # Business Logic Layer
│   │   ├── settingsService.js
│   │   ├── recordingService.js
│   │   ├── deepgramService.js
│   │   └── groqService.js
│   ├── controllers/                 # Application Layer
│   │   ├── settingsController.js
│   │   └── recordingController.js
│   ├── routes/                      # API Routes
│   │   ├── authRoutes.js
│   │   ├── settingsRoutes.js
│   │   └── recordingRoutes.js
│   ├── middleware/                  # Cross-cutting Concerns
│   ├── utils/                       # Utilities
│   │   ├── logger.js
│   │   └── audioWSHandler.js
│   ├── server.js                    # Entry Point
│   └── package.json
│
└── client/                          # Frontend (React)
    ├── src/
    │   ├── config/                  # Infrastructure Layer
    │   │   ├── api.js
    │   │   └── constants.js
    │   ├── services/                # Data Access Layer
    │   │   ├── settingsAPI.js
    │   │   ├── recordingAPI.js
    │   │   └── audioStream.js
    │   ├── context/                 # Business Logic Layer
    │   │   └── AppContext.js
    │   ├── hooks/                   # Business Logic Layer
    │   │   ├── useApp.js
    │   │   └── useAudioRecorder.js
    │   ├── components/              # Presentation Layer
    │   │   ├── MenuBar.js
    │   │   ├── RecordingOverlay.js
    │   │   ├── WaveformOverlay.js
    │   │   ├── SettingsView.js
    │   │   ├── TranscriptDisplay.js
    │   │   └── RecordingsList.js
    │   ├── pages/                   # Presentation Layer
    │   │   └── HomePage.js
    │   ├── styles/                  # CSS Styling
    │   ├── App.js
    │   ├── index.js
    │   └── App.css
    ├── public/
    │   └── index.html
    └── package.json
```

## Layered Architecture

### Backend Layers

1. **Infrastructure Layer** (`config/`)
   - Database configuration
   - Constants and environment setup

2. **Data Access Layer** (`models/`)
   - MongoDB schemas
   - Database queries

3. **Business Logic Layer** (`services/`)
   - Core application logic
   - Integration with external APIs (Deepgram, Groq)
   - Complex computations

4. **Application Layer** (`controllers/`)
   - Request handling
   - Response formatting
   - Input validation

5. **Presentation Layer** (`routes/`)
   - API endpoints
   - Routing definitions

### Frontend Layers

1. **Infrastructure Layer** (`config/`, `utils/`)
   - API endpoints
   - Constants, helpers, utilities

2. **Data Access Layer** (`services/`)
   - API calls
   - WebSocket connections
   - External service integration

3. **Business Logic Layer** (`context/`, `hooks/`)
   - State management (React Context)
   - Complex logic (custom hooks)
   - Data transformation

4. **Presentation Layer** (`components/`, `pages/`, `styles/`)
   - UI components
   - Pages
   - Styling

## Features

✅ **Real-time Speech-to-Text** - WebSocket streaming to Deepgram
✅ **Multi-language Support** - 90+ languages
✅ **Post-processing** - Spelling, grammar, translation via Groq LLM
✅ **Code-Mix Support** - Hinglish, Tanglish, Spanglish, etc.
✅ **Recording History** - MongoDB storage with playback
✅ **Settings Persistence** - Save preferences
✅ **Windows Compatible** - Works in any modern browser on Windows
✅ **Waveform Animation** - Live audio visualization
✅ **Responsive Design** - Works on desktop and tablet

## Installation

### Prerequisites
- Node.js 16+
- MongoDB (local or cloud)
- Deepgram API key (free tier available)
- Groq API key (optional, for post-processing)

### Server Setup

```bash
cd server
npm install
cp .env.example .env
# Edit .env with your API keys
npm run dev
```

### Client Setup

```bash
cd client
npm install
npm start
```

## Environment Variables

### Server `.env`
```
MONGODB_URI=mongodb://localhost:27017/vocalflow
NODE_ENV=development
PORT=5000
DEEPGRAM_API_KEY=your_key_here
GROQ_API_KEY=your_key_here
```

### Client `.env` (optional, defaults to localhost)
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_WS_URL=ws://localhost:5000/ws
```

## Usage

1. Open http://localhost:3000 in your browser
2. Go to Settings and add your Deepgram API key
3. Hold ALT key (or configured hotkey) to start recording
4. Release to transcribe
5. View history in the Recordings list

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register user

### Settings
- `GET /api/settings/:userId` - Get user settings
- `PUT /api/settings/:userId` - Update settings
- `POST /api/settings/models/deepgram` - Fetch Deepgram models
- `POST /api/settings/models/groq` - Fetch Groq models

### Recordings
- `GET /api/recordings/:userId` - Get recordings
- `POST /api/recordings/:userId` - Save recording
- `DELETE /api/recordings/:userId/:recordingId` - Delete recording

### WebSocket
- `ws://localhost:5000/ws/audio` - Audio streaming (requires auth)

## Keyboard Shortcuts

- **ALT** - Hold to record (configurable)
- **⌘+,** - Open settings (when implemented)
- **⌘+Q** - Quit (web: close tab)

## Technologies

**Backend:**
- Node.js, Express.js
- MongoDB + Mongoose
- WebSocket (ws library)
- Axios (HTTP client)

**Frontend:**
- React 18
- React Context API (state)
- Web Audio API
- CSS3 (animations)

**External Services:**
- Deepgram (Speech-to-Text)
- Groq (LLM Post-processing)

## Windows-Specific Notes

- ALT key used for recording trigger (can be changed in settings)
- Microphone access required - browser will prompt
- Works in Edge, Chrome, Firefox on Windows 10/11

## Development

```bash
# Terminal 1: Start backend
cd server && npm run dev

# Terminal 2: Start frontend
cd client && npm start
```

## Production Build

```bash
# Frontend
cd client && npm run build

# Backend runs with: NODE_ENV=production npm start
```

## License

MIT

## Original macOS Version

See `/vocalflow` for the native Swift/SwiftUI macOS application.
