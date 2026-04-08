# VocalFlow Audio Issue - Troubleshooting Guide

## Problem Summary
- Deepgram consistently returns **empty transcripts** with 0% confidence
- Audio data is arriving but appears to be **all zeros** or **very quiet**
- Browser is capturing at 48000Hz ✓ but audio magnitude is too low

## What I've Fixed
✅ **Added 3x audio gain amplification** - Microphone input now amplified before processing
✅ **Created audio diagnostics utility** - Test microphone and audio levels

## Immediate Testing Steps

### Step 1: Run Audio Diagnostics
Open browser console and run:
```javascript
import { debugAudio } from './utils/audioDebug';
debugAudio();
```

This will:
- Check microphone permissions
- Display real-time audio levels (0-255 scale)
- Show what the AudioWorklet is capturing
- **Expected**: Should see levels rise when you speak

**Normal values:**
- Silence: 5-20/255
- Normal speech: 50-100/255
- Loud speech: 100-200/255

### Step 2: Check Windows Audio Settings
1. **Right-click speaker icon** → Open Sound settings
2. **Input devices** → Check microphone is not muted
3. **Levels tab** → Microphone volume should be 50-100%
4. **Advanced** → Check microphone format is 16-bit, 48kHz

### Step 3: Verify Microphone in Browser
1. Open `chrome://settings/content/microphone`
2. Check `https://localhost:5000` has permission
3. If not listed, click "Add" and allow it

### Step 4: Test Recording
1. Start the app fresh
2. Can you **hear audio feedback** when you speak? (should be muted for this app)
3. Check browser console for `Audio gain node initialized`

## What the Fix Does
- **Before**: Microphone signal → AudioWorklet → Deepgram (very quiet)
- **After**: Microphone signal → **Gain Node (3x)** → AudioWorklet → Deepgram (amplified)

This multiplies the audio signal by 3, making quiet microphones audible.

## If Still Not Working

### Option A: Increase Gain Further
Edit [useAudioRecorder.js](../../client/src/hooks/useAudioRecorder.js#L66):
```javascript
gainNode.gain.value = 5.0; // Try 5x instead of 3x
// or even 10.0 for very quiet input
```

### Option B: Check Microphone Permissions
```javascript
const devices = await navigator.mediaDevices.enumerateDevices();
const audioInput = devices.filter(d => d.kind === 'audioinput');
console.log('Available input devices:', audioInput);
```

### Option C: Verify Audio is Being Sent
Check browser DevTools → Network tab:
- During recording, you should see **binary frames** being sent to `ws://localhost:5000/ws/audio`
- Don't see any? Audio isn't being captured

### Option D: Inspect Raw Audio Data
The debug console should show:
```
📤 Audio chunks sent: 10 (avg magnitude: 0.XX)
```

**Before fix**: magnitude was 0.0000-0.3041
**After fix (expected)**: magnitude should be 0.0-0.9 (3x higher)

## Advanced Diagnostics

### Check Deepgram Receives Real Audio
Edit [server/services/deepgramService.js](../../server/services/deepgramService.js#L125):
```javascript
// After line 125, add:
if (this.audioChunksReceived % 10 === 0) {
  const isZero = audioBuffer.every(b => b === 0);
  logger.info(`Audio chunk is all zeros: ${isZero}`);
}
```

Restart server and check logs. If showing `true`, the issue is in audio capture.

### Verify Sample Rate
Browser logs should show: `🎵 Browser audio context sample rate: 48000Hz`

If different, audio resampling might be needed.

## Expected Success Indicators
✅ Audio magnitude increases from 0.0 to 0.5+ when speaking
✅ Console shows `📤 Audio chunks sent: X` with non-zero magnitudes
✅ Backend receives non-zero audio bytes
✅ Deepgram returns transcripts with confidence > 0
✅ You see text in real-time during speech

## Rollback If Something Breaks
The gain node is connected at line 70 and 128. If issues arise, change:
```javascript
gainNode.gain.value = 1.0; // Set to 1.0 (no amplification, original behavior)
```

---

**File Modified**: [useAudioRecorder.js](../../client/src/hooks/useAudioRecorder.js)
**Lines Changed**: 68-70 (gain node creation), 95, 128 (gain connections)
