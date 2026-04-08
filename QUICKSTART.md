# VocalFlow MERN Stack - Quick Start Guide

## 🎯 Project Overview

VocalFlow Web is a complete **browser-based voice-to-text application** using the **MERN stack**. It's an exact replica of the native macOS app, but now accessible on **Windows and all modern browsers**.

### Key Features
✅ Real-time speech-to-text streaming  
✅ Multi-language support (90+)  
✅ AI post-processing (spelling, grammar, translation)  
✅ Code-mix language support (Hinglish, Tanglish, etc.)  
✅ Recording history with MongoDB  
✅ WebSocket-based audio streaming  
✅ Fully responsive UI  
✅ Windows-native support  

---

## 📁 Project Structure (Layered Architecture)

### Backend (`/server`)
```
Layers from bottom to top:
Infrastructure → Data Access → Business Logic → Application → Presentation
config/         models/        services/       controllers/  routes/
```

- **Infrastructure Layer**: Database & constants setup
- **Data Access Layer**: MongoDB models (Settings, Recording)
- **Business Logic Layer**: Services for Deepgram, Groq, Settings, Recordings
- **Application Layer**: Controllers handling requests
- **Presentation Layer**: API routes (REST endpoints)

### Frontend (`/client`)
```
Layers from bottom to top:
Infrastructure → Data Access → Business Logic → Presentation
config/         services/      context/hooks/  components/pages/
```

- **Infrastructure Layer**: API config & constants
- **Data Access Layer**: API calls & WebSocket
- **Business Logic Layer**: Context (state) & hooks
- **Presentation Layer**: React components & pages

---

## 🚀 Quick Start (Windows)

### Prerequisites
```
✓ Node.js 16+ installed
✓ MongoDB running locally (or cloud connection string)
✓ Deepgram API key (free: deepgram.com)
✓ Groq API key (optional, groq.com)
```

### 1. Setup Backend

```bash
cd server
npm install
```

Create `.env` file:
```
MONGODB_URI=mongodb://localhost:27017/vocalflow
NODE_ENV=development
PORT=5000
DEEPGRAM_API_KEY=your_key
GROQ_API_KEY=your_key
```

### 2. Setup Frontend

```bash
cd ../client
npm install
```

### 3. Start Both Services

**Option A: Using batch script (Windows)**
```bash
start.bat
```

**Option B: Manual (two terminals)**
```
Terminal 1:
cd server && npm run dev

Terminal 2:
cd client && npm start
```

### 4. Open Application
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000

---

## 🎮 How to Use

1. **Open Settings** (⚙️ button)
2. **Add Deepgram API Key** - Get free key from deepgram.com
3. **Select Model & Language** - Click "Fetch Models"
4. **Enable Post-Processing** (optional):
   - Spelling correction
   - Grammar correction
   - Translation
   - Code-mix languages
5. **Start Recording**:
   - Hold **ALT** key to record
   - Release to transcribe
   - View results in transcript display
6. **Review History**:
   - All recordings saved to MongoDB
   - Shows original & processed text

---

## 🏗️ Architecture Deep Dive

### Backend Flow

```
Client → WebSocket Connection → Backend
                                  ↓
                        AudioWSHandler (utils/)
                                  ↓
                        DeepgramService (services/)
                          ↓        ↓
                      WebSocket   API
                          ↓        ↓
                        Deepgram API
                                  ↓
                        Transcript Response
                                  ↓
                        RecordingService (services/)
                                  ↓
                        GroqService (optional post-processing)
                                  ↓
                        Recording Model (data access)
                                  ↓
                        MongoDB
```

### Frontend Flow

```
HomePage (page)
  ↓
AppProvider (context)
  ↓
useAppState hook
  ↓
AppContext (state management)
  ↓
Components:
  - MenuBar
  - RecordingOverlay
  - SettingsView
  - TranscriptDisplay
  - RecordingsList
  ↓
Services:
  - SettingsAPI (fetch/update)
  - RecordingAPI (save/delete)
  - AudioStreamService (WebSocket)
```

---

## 📋 File Organization

### Server Structure
```
server/
├── config/
│   ├── database.js          ← MongoDB connection
│   └── constants.js         ← App constants
├── models/
│   ├── Settings.js          ← Settings schema
│   └── Recording.js         ← Recording schema
├── services/
│   ├── settingsService.js   ← Settings logic
│   ├── recordingService.js  ← Recording logic
│   ├── deepgramService.js   ← Deepgram integration
│   └── groqService.js       ← Groq LLM integration
├── controllers/
│   ├── settingsController.js ← Settings handler
│   └── recordingController.js ← Recording handler
├── routes/
│   ├── authRoutes.js        ← Auth endpoints
│   ├── settingsRoutes.js    ← Settings endpoints
│   └── recordingRoutes.js   ← Recording endpoints
├── utils/
│   ├── logger.js            ← Logging utility
│   └── audioWSHandler.js    ← WebSocket handler
└── server.js                ← Entry point
```

### Client Structure
```
client/src/
├── config/
│   ├── api.js               ← API endpoints
│   └── constants.js         ← App constants
├── services/
│   ├── settingsAPI.js       ← Settings API calls
│   ├── recordingAPI.js      ← Recording API calls
│   └── audioStream.js       ← WebSocket service
├── context/
│   └── AppContext.js        ← State management
├── hooks/
│   ├── useApp.js            ← App state hooks
│   └── useAudioRecorder.js  ← Audio recording logic
├── components/
│   ├── MenuBar.js           ← Top menu
│   ├── RecordingOverlay.js  ← Recording indicator
│   ├── SettingsView.js      ← Settings form
│   ├── TranscriptDisplay.js ← Transcript view
│   ├── WaveformOverlay.js   ← Waveform animation
│   └── RecordingsList.js    ← History list
├── pages/
│   └── HomePage.js          ← Main page
├── styles/
│   ├── MenuBar.css
│   ├── RecordingOverlay.css
│   ├── SettingsView.css
│   ├── ... (other styles)
├── App.js                   ← App component
└── index.js                 ← React entry
```

---

## 🔌 API Endpoints

### Authentication
```
POST /api/auth/login       → Login user
POST /api/auth/register    → Register user
```

### Settings
```
GET  /api/settings/:userId                  → Get user settings
PUT  /api/settings/:userId                  → Update settings
POST /api/settings/models/deepgram          → Fetch Deepgram models
POST /api/settings/models/groq               → Fetch Groq models
```

### Recordings
```
GET    /api/recordings/:userId               → List recordings
POST   /api/recordings/:userId               → Save recording
DELETE /api/recordings/:userId/:recordingId  → Delete recording
```

### WebSocket
```
ws://localhost:5000/ws/audio
Events: start, stop, message (streaming)
```

---

## 🛠️ Available Scripts

### Server
```bash
npm run dev    # Development with nodemon
npm start      # Production
```

### Client
```bash
npm start      # Development (watches for changes)
npm build      # Production build
npm test       # Run tests
```

### Root Level
```bash
./start.sh     # Start both (Linux/Mac)
start.bat      # Start both (Windows)
./build.sh     # Production build (Linux/Mac)
build.bat      # Production build (Windows)
```

---

## 🌐 Environment Variables

### Server `.env`
```
MONGODB_URI=mongodb://localhost:27017/vocalflow
NODE_ENV=development
PORT=5000
DEEPGRAM_API_KEY=your_key_here
GROQ_API_KEY=your_key_here (optional)
```

### Client `.env` (optional)
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_WS_URL=ws://localhost:5000/ws
```

---

## 💡 How Deepgram Integration Works

1. **User records audio** → Browser captures PCM data
2. **WebSocket connection** → Audio streamed to backend
3. **Backend receives audio** → Forwards to Deepgram API
4. **Real-time streaming** → Interim + final results
5. **Processing** → Optional Groq post-processing
6. **Storage** → Save to MongoDB
7. **Display** → Show to user in transcript box

---

## 🔄 Audio Processing Pipeline

```
Microphone
  ↓ (Web Audio API)
PCM 16-bit, 16kHz, Mono
  ↓ (WebSocket)
Backend
  ↓ (Deepgram API)
Speech-to-Text
  ↓ (Optional)
Groq LLM Post-processing
  ↓ (Spelling, Grammar, Translation)
Final Transcript
  ↓
MongoDB Storage
  ↓
React Display
```

---

## 🐛 Troubleshooting

### Microphone Not Working
- Allow browser microphone access
- Check Settings → Permissions
- Try different browser

### "Can't connect to server"
- Verify backend running: http://localhost:5000
- Check server logs in terminal
- Verify port 5000 is open

### "Invalid API Key"
- Double-check Deepgram API key in settings
- Regenerate key if needed
- Verify .env has correct key

### Recordings Not Saving
- Check MongoDB is running
- Verify connection string in .env
- Check browser console for errors

---

## 🎨 UI Components & Styling

All styled with **CSS3** featuring:
- Gradient backgrounds
- Smooth animations
- Responsive design
- Dark/light mode ready
- Mobile-friendly

---

## 📦 Production Deployment

### Build for Production
```bash
./build.bat  # or ./build.sh on Mac/Linux
```

### Run Production Server
```bash
cd server
set NODE_ENV=production
npm install --production
npm start
```

### Deploy Frontend
```bash
cd client/build
# Upload to: Netlify, Vercel, AWS S3, etc.
```

---

## 🔐 Security Notes

- API keys stored in environment variables
- WebSocket for encrypted audio streaming (over HTTPS)
- MongoDB with proper authentication
- CORS enabled for specified origins
- No hardcoded credentials

---

## 📚 Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend UI | React 18, CSS3 |
| State Management | React Context + Hooks |
| Backend Framework | Express.js |
| Database | MongoDB + Mongoose |
| Real-time | WebSocket (ws library) |
| HTTP Client | Axios |
| Audio API | Web Audio API |
| External APIs | Deepgram, Groq |

---

##✨ Next Steps

1. **Install dependencies**: `npm install` in both server & client
2. **Configure API keys**: Add to .env
3. **Start services**: `start.bat` (Windows) or `./start.sh`
4. **Test recording**: Hold ALT key
5. **View history**: Check recordings list

---

## 📖 Additional Resources

- [Deepgram Docs](https://developers.deepgram.com)
- [Groq Docs](https://console.groq.com/docs)
- [React Documentation](https://react.dev)
- [Express.js Guide](https://expressjs.com)
- [MongoDB Manual](https://docs.mongodb.com/manual)

---

**VocalFlow Web v1.0.0** | Windows Compatible | MERN Stack | Layered Architecture
