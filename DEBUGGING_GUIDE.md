# Deepgram Integration Debugging Guide

## What Was Changed

Enhanced logging in backend services to diagnose why Deepgram isn't responding:

### deepgramService.js Updates:
- ✅ Added `audioChunksReceived` counter in constructor
- ✅ Enhanced `sendAudio()` with detailed logging (logs every 50 chunks)
- ✅ Added error handling in Deepgram WebSocket callbacks (open, close, error)
- ✅ Detailed logging in `handleMessage()` to track response parsing
- ✅ Updated `startRecording()` and `stopRecording()` with chunk count logging

### Expected Debug Output

When you record audio, the **backend terminal** should show:

```
🎤 Recording started: model=nova-2, language=en
📤 Sent 50 audio chunks to Deepgram (0.10s)
📤 Sent 100 audio chunks to Deepgram (0.20s)
...continues every 50 chunks...
⏹️  Recording stopped. Total chunks: 460

Deepgram response: {
  type: 'Results',
  is_final: false,
  hasTranscript: true
}
Interim transcript: Hello there

Deepgram response: {
  type: 'Results',
  is_final: true,
  hasTranscript: true
}
Final transcript: Hello there, how are you?
```

## Testing Steps

### Step 1: Hard Reload Frontend
```
Ctrl + Shift + R (Windows)
⌘ + Shift + R (Mac)
```

### Step 2: Watch Backend Terminal
Keep your backend terminal **visible** while testing:
```bash
npm start
```

### Step 3: Record a Test Audio
1. Press **ALT** or **SPACEBAR** key
2. Say something short like "Hello world"
3. Press **ENTER** or release your key

### Step 4: Check Backend Logs

#### ✅ **Success Indicators** - Look for:
- `✓ Connected to Deepgram` → Backend connected to Deepgram
- `📤 Sent XXX audio chunks to Deepgram` → Audio is flowing to Deepgram
- `Deepgram response:` → Deepgram is responding
- `Interim transcript:` → Deepgram recognized speech
- `Final transcript:` → Complete transcription received

#### ❌ **Failure Indicators** - Check for:

| Error | What It Means | Fix |
|-------|---------------|-----|
| `Deepgram API key is required` | API key not sent from frontend | Check Settings page - paste API key and save |
| `Deepgram WebSocket error: ECONNREFUSED` | Network issue connecting to Deepgram | Check internet, firewall, or API key validity |
| `Cannot send audio - WebSocket not open` | Connection failed silently | Check API key format - might have extra spaces |
| `Cannot send audio - State: X` | WebSocket in wrong state (X=0,2,3) | Timing issue - audio sent before connection ready |
| No response from Deepgram | Audio reaches Deepgram but no response | Check: API key valid? Deepgram account active? |

### Step 5: Frontend Console Should Show

After audio buffering fix:
```
✓ WebSocket connected to backend
📤 Audio chunks sent: 10, 20, 30, ... 460
⏹️ Stop recording called
✓ Audio unmuted
📨 Message from backend: connected
✓ Deepgram is ready, sending buffered audio...
✓ Received event: interim_transcript "Hello"
✓ Received event: interim_transcript "Hello world"
✓ Received event: final_transcript "Hello world"
✓ Transcript saved!
```

## Common Issues & Solutions

### Issue 1: API Key Problems

**Sign:** Backend shows `Deepgram API key is required`

**Solution:**
1. Go to frontend Settings (gear icon)
2. Paste your Deepgram API key
3. Click "Save changes"
4. Hard reload page: `Ctrl+Shift+R`

### Issue 2: No Response from Deepgram

**Sign:** Audio sent but no `Deepgram response:` in backend logs

**Possible Causes:**
1. Invalid API key format (has spaces, wrong token type)
2. API key from wrong Deepgram project
3. Deepgram account out of credits
4. Network firewall blocking Deepgram WebSocket

**Solution:**
1. Verify API key: Go to https://console.deepgram.com → Copy FULL API key
2. Test API key directly:
   ```bash
   curl -X GET https://api.deepgram.com/v1/models \
     -H "Authorization: Token YOUR_API_KEY_HERE"
   ```
3. Should see list of available models (not 401 error)

### Issue 3: Connection Timeout

**Sign:** `⏱️ Deepgram response timeout` after 15 seconds

**Solution:** This is expected if no audio is reaching Deepgram. First fix Issue #1 or #2.

## Verification Checklist

- [ ] Backend terminal shows `✓ Connected to Deepgram` when recording
- [ ] Backend terminal shows `📤 Sent XXX audio chunks` entries
- [ ] Backend terminal shows `Deepgram response:` entries
- [ ] Frontend console shows interim transcripts appearing
- [ ] Final transcript appears within 2-3 seconds of finishing speech
- [ ] No error messages in either terminal

## Next Steps

After running through these tests:

1. **If transcript appears**: ✅ Deepgram integration working! 
   - Move on to testing text processing options
   - Optimize response time if needed

2. **If still no transcript**: ❌ Backend connectivity issue
   - Check backend logs for exact error messages
   - Share backend logs with debugging context

3. **If intermittent**: ⚠️  Connection timing issue
   - Try recording multiple times
   - Backend logs should show consistent "Connected to Deepgram" messages

## Manual Backend Testing

To test Deepgram connection without frontend:

```bash
# Terminal in server directory
node -e "
const DeepgramService = require('./services/deepgramService');
const svc = new DeepgramService();

const mockWs = {
  send: (data) => console.log('Would send:', data.length, 'bytes'),
  readyState: 1
};

svc.connectWebSocket(mockWs, 'YOUR_API_KEY_HERE', 'nova-2', 'en')
  .then(() => {
    console.log('Connected!');
    setTimeout(() => process.exit(0), 2000);
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
"
```

---

**Last Updated:** After audio buffering implementation
**Status:** Awaiting backend log verification
