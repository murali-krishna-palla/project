# VocalFlow MERN - Layered Architecture Documentation

## 🏗️ Overall System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER BROWSER (Windows)                         │
├─────────────────────────────────────────────────────────────────────────┤
│                       Frontend - React Application                       │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ PRESENTATION LAYER (Components & Pages)                          │  │
│  │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │  │
│  │ │MenuBar   │ │Settings  │ │Transcript│ │Recording │            │  │
│  │ │          │ │View      │ │Display   │ │List      │            │  │
│  │ │Recording │ │Waveform  │ │          │ │          │            │  │
│  │ │Overlay   │ │Overlay   │ │          │ │          │            │  │
│  │ └──────────┘ └──────────┘ └──────────┘ └──────────┘            │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ BUSINESS LOGIC LAYER (State & Hooks)                             │  │
│  │ ┌─────────────────┐ ┌──────────────┐ ┌──────────────┐          │  │
│  │ │AppContext       │ │useApp        │ │useAudioRec   │          │  │
│  │ │(State Mgmt)     │ │(App Logic)   │ │(Record Logic)│          │  │
│  │ └─────────────────┘ └──────────────┘ └──────────────┘          │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ DATA ACCESS LAYER (API Calls)                                    │  │
│  │ ┌────────────┐ ┌────────────┐ ┌────────────┐                   │  │
│  │ │SettingsAPI │ │RecordingAPI│ │AudioStream │ WebSocket         │  │
│  │ └────────────┘ └────────────┘ └────────────┘                   │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ INFRASTRUCTURE LAYER (Config)                                    │  │
│  │ ┌─────────────────────────────────────────────────────────────┐ │  │
│  │ │ API Endpoints │ Constants │ Utilities │ CSS Styles         │ │  │
│  │ └─────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↕
                           HTTP & WebSocket
                                    ↕
┌─────────────────────────────────────────────────────────────────────────┐
│                     Backend Server (Node.js + Express)                   │
├─────────────────────────────────────────────────────────────────────────┤
│                       Express Application                                 │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ PRESENTATION LAYER (Routes & API Endpoints)                      │  │
│  │ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │  │
│  │ │authRoutes    │ │settingsRoutes│ │recordingRoute│             │  │
│  │ │POST /login   │ │GET /settings │ │POST /record  │             │  │
│  │ │POST /register│ │PUT /settings │ │GET /record   │             │  │
│  │ └──────────────┘ └──────────────┘ └──────────────┘             │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ APPLICATION LAYER (Controllers)                                  │  │
│  │ ┌──────────────────┐ ┌──────────────────┐                       │  │
│  │ │settingsController│ │recordingControlle│                       │  │
│  │ │ - getSettings    │ │ - getRecordings  │                       │  │
│  │ │ - updateSettings │ │ - saveRecording  │                       │  │
│  │ │ - fetchModels    │ │ - deleteRecording│                       │  │
│  │ └──────────────────┘ └──────────────────┘                       │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ BUSINESS LOGIC LAYER (Services)                                  │  │
│  │ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐        │  │
│  │ │settingsService │ │recordingService│ │deepgramService │        │  │
│  │ │ - getSettings  │ │ - getRecording │ │ - connectWS    │        │  │
│  │ │ - updateSet    │ │ - saveRecording│ │ - sendAudio    │        │  │
│  │ │ - fetchModels  │ │ - deleteRecord │ │ - parseResponse│        │  │
│  │ └────────────────┘ └────────────────┘ └────────────────┘        │  │
│  │                                                                    │  │
│  │ ┌────────────────┐ ┌──────────────┐                             │  │
│  │ │groqService     │ │audioWSHandler│ WebSocket Manager           │  │
│  │ │ - processText  │ │ - connect    │                             │  │
│  │ │ - buildPrompt  │ │ - onMessage  │                             │  │
│  │ │ - fetchModels  │ │ - onClose    │                             │  │
│  │ └────────────────┘ └──────────────┘                             │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ DATA ACCESS LAYER (Models & Database)                            │  │
│  │ ┌─────────────────────┐ ┌─────────────────────┐                │  │
│  │ │Settings Model       │ │Recording Model      │                │  │
│  │ │ - userId            │ │ - userId            │                │  │
│  │ │ - deepgramApiKey    │ │ - originalTranscript│                │  │
│  │ │ - groqApiKey        │ │ - processedTranscript                │  │
│  │ │ - selectedModel     │ │ - model, language   │                │  │
│  │ │ - features toggles  │ │ - processingApplied │                │  │
│  │ └─────────────────────┘ └─────────────────────┘                │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ INFRASTRUCTURE LAYER (Config & Utilities)                        │  │
│  │ ┌────────────────┐ ┌────────────────┐ ┌──────────────┐         │  │
│  │ │database.js     │ │constants.js    │ │logger.js     │         │  │
│  │ │ - MongoDB conn │ │ - Audio config │ │ - Logging    │         │  │
│  │ │ - Pool setup   │ │ - API URLs     │ │ utility      │         │  │
│  │ │                │ │ - Code-mix lang│ │              │         │  │
│  │ └────────────────┘ └────────────────┘ └──────────────┘         │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↕
                      External Service APIs
                                    ↕
┌─────────────────────────────────────────────────────────────────────────┐
│                        MongoDB Database                                   │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Collections:                                                        │ │
│ │ • settings (User preferences, API keys, model selections)         │ │
│ │ • recordings (Transcript history, processing metadata)            │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↕
                       External Services
                                    ↕
      ┌──────────────────┬──────────────────┐
      │                  │                  │
      ↓                  ↓                  ↓
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Deepgram    │ │ Groq LLM     │ │ Optional:    │
│ Speech-to-   │ │ Post-process │ │ - Auth/JWT   │
│  Text API    │ │ with LLM     │ │ - Cache      │
│              │ │              │ │ - Analytics  │
└──────────────┘ └──────────────┘ └──────────────┘
```

---

## 🔄 Data Flow: Recording to Transcript

```
1. USER ACTION (Frontend)
   ├─ Hold ALT key → startRecording()
   │
2. AUDIO CAPTURE (Browser Web Audio API)
   ├─ requestMicrophone() → getUserMedia()
   ├─ Create AudioContext
   ├─ Create ScriptProcessor
   ├─ Capture PCM data (16kHz, 16-bit, mono)
   │
3. ESTABLISH CONNECTION (Frontend Service Layer)
   ├─ AudioStreamService.connect()
   ├─ Create WebSocket connection
   ├─ Send: { action: 'start', apiKey, model, language }
   │
4. BACKEND RECEIVES CONNECTION (Backend)
   ├─ audioWSHandler processes connection
   ├─ DeepgramService.connectWebSocket()
   ├─ Create WebSocket to Deepgram
   ├─ Send credentials
   │
5. STREAM AUDIO (Continuous)
   ├─ Browser → WebSocket → Backend
   ├─ Backend → Deepgram WebSocket
   │
6. RECEIVE INTERIM RESULTS
   ├─ Deepgram → Backend
   ├─ Parse JSON response
   ├─ Backend → Browser WebSocket
   ├─ Frontend displays in TranscriptDisplay
   │
7. STOP RECORDING (Frontend)
   ├─ Release ALT key → stopRecording()
   ├─ Send: { action: 'stop' }
   ├─ Close microphone stream
   │
8. RECEIVE FINAL TRANSCRIPT
   ├─ Deepgram sends final result
   ├─ is_final: true flag
   ├─ extract full transcript
   │
9. OPTIONAL: POST-PROCESSING (Backend)
   ├─ Check if Groq enabled
   ├─ GroqService.processText()
   ├─ Send to Groq API
   ├─ Apply: spelling, grammar, translation
   │
10. SAVE TO DATABASE
    ├─ RecordingService.saveRecording()
    ├─ Create Recording document
    ├─ Store original + processed transcript
    ├─ Save to MongoDB
    │
11. DISPLAY RESULTS (Frontend)
    ├─ Update interimTranscript state
    ├─ Show in TranscriptDisplay component
    ├─ Save to context (AppContext)
    │
12. SHOW IN HISTORY
    ├─ Query recordings from MongoDB
    ├─ Display in RecordingsList component
    ├─ Allow delete/export
```

---

## 📊 Layer Responsibilities

### Frontend Layers

#### 1️⃣ Infrastructure Layer (`config/`, `utils/`)
**Responsibility**: Provide configuration and utilities
```
- api.js: Define all API endpoints
- constants.js: App-wide constants
```

#### 2️⃣ Data Access Layer (`services/`)
**Responsibility**: External communication
```
- settingsAPI.js: Fetch/update settings
- recordingAPI.js: Save/delete recordings
- audioStream.js: WebSocket audio streaming
```

#### 3️⃣ Business Logic Layer (`context/`, `hooks/`)
**Responsibility**: State & complex logic
```
- AppContext.js: Global state management
- useApp.js: App state hooks
- useAudioRecorder.js: Audio recording logic
```

#### 4️⃣ Presentation Layer (`components/`, `pages/`)
**Responsibility**: UI rendering
```
- components/: Reusable UI pieces
- pages/: Full pages
- styles/: CSS styling
```

### Backend Layers

#### 1️⃣ Infrastructure Layer (`config/`, `utils/`)
**Responsibility**: Setup & utilities
```
- database.js: MongoDB connection pool
- constants.js: API constants, code-mix languages
- logger.js: Logging utility
```

#### 2️⃣ Data Access Layer (`models/`)
**Responsibility**: Database schemas
```
- Settings.js: Settings document structure
- Recording.js: Recording document structure
```

#### 3️⃣ Business Logic Layer (`services/`)
**Responsibility**: Core logic
```
- settingsService.js: Settings management
- recordingService.js: Recording management
- deepgramService.js: Deepgram integrationgroqService.js: Groq integration
- audioWSHandler.js: WebSocket coordination
```

#### 4️⃣ Application Layer (`controllers/`)
**Responsibility**: Request handling
```
- settingsController.js: Settings endpoints handler
- recordingController.js: Recording endpoints handler
```

#### 5️⃣ Presentation Layer (`routes/`)
**Responsibility**: API endpoints
```
- authRoutes.js: /auth/* endpoints
- settingsRoutes.js: /settings/* endpoints
- recordingRoutes.js: /recordings/* endpoints
```

---

## 🔒 Separation of Concerns

### Each Layer Only Handles Its Responsibility

```
✓ Frontend Components DON'T call APIs directly
  ↓ They use Services
  
✓ Services DON'T manage state
  ↓ They return data to Hooks/Context
  
✓ Hooks DON'T render UI
  ↓ They provide state to Components
  
✓ Backend Controllers DON'T do business logic
  ↓ They call Services
  
✓ Services DON'T know about HTTP
  ↓ Controllers handle that
  
✓ Models DON'T contain logic
  ↓ Services use them
```

---

## 🔗 Communication Between Layers

### Frontend Example: Loading Settings

```
HomePage (Presentation)
  ↓ uses
AppProvider (Infrastructure - Context setup)
  ↓ mounts
useAppState hook (Business Logic)
  ↓ calls
SettingsAPIService.getSettings() (Data Access)
  ↓ calls
fetch(API_ENDPOINTS.SETTINGS(userId)) (Infrastructure)
  ↓ returns to
AppContext state update (Business Logic)
  ↓ Component re-renders (Presentation)
```

### Backend Example: Saving Recording

```
POST /api/recordings/:userId (Route - Presentation)
  ↓
RecordingController.saveRecording() (Controller - Application)
  ↓
RecordingService.saveRecording() (Service - Business Logic)
  ↓
// Optional Groq processing
GroqService.processText() (Service - Business Logic)
  ↓
Recording.create() (Model - Data Access)
  ↓
MongoDB collection (Database)
  ↓
Return to client (Presentation Layer)
```

---

## 🎯 Benefits of Layered Architecture

✅ **Separation of Concerns** - Each layer has one responsibility  
✅ **Testability** - Easy to unit test each layer  
✅ **Maintainability** - Changes in one layer don't affect others  
✅ **Scalability** - Add features without disrupting existing code  
✅ **Reusability** - Services can be used by multiple components  
✅ **Flexibility** - Swap implementations (e.g., localStorage instead of API)  
✅ **Clarity** - Clear structure makes code easy to understand  
✅ **Team Development** - Teams can work on different layers  

---

## 📈 Scaling the Application

### Adding a New Feature: "Voice Commands"

**Without Layered Architecture**: Modify everywhere
**With Layered Architecture**:

1. **Infrastructure**: Add `voiceCommands` constant
2. **Data Access**: 
   - Add `VoiceCommand` MongoDB model
   - Create `voiceCommandAPI.js` service
3. **Business Logic**:
   - Create `useVoiceCommands` hook
   - Add to `AppContext`
4. **Presentation**:
   - Create `VoiceCommands.js` component
   - Add to `HomePage`

Done! No changes to existing code.

---

## 🚀 Deployment Architecture

```
Development
├─ localhost:3000 (React dev server)
└─ localhost:5000 (Express dev server)

Production
├─ Frontend:
│  └─ Netlify/Vercel (builds to static files)
│
├─ Backend:
│  └─ Heroku/Railway/Cloud Run (Node.js server)
│
└─ Database:
   └─ MongoDB Atlas (cloud database)
```

---

## 📚 References

- **Frontend**: React 18 Hooks, Context API
- **Backend**: Express.js, Mongoose ODM
- **Database**: MongoDB
- **Real-time**: WebSocket (ws library)
- **External**: Deepgram API, Groq API

---

**VocalFlow Architecture** | Layered Approach | Production-Ready
