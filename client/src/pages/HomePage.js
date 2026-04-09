import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppProvider } from '../context/AppContext';
import { useAppState } from '../hooks/useApp';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import AuthService from '../services/authAPI';
import PermissionsManager from '../services/permissionsManager';
import MenuBar from '../components/MenuBar';
import RecordingOverlay from '../components/RecordingOverlay';
import SettingsView from '../components/SettingsView';
import TranscriptDisplay from '../components/TranscriptDisplay';
import RecordingsList from '../components/RecordingsList';
import RecordingAPIService from '../services/recordingAPI';
import { HOTKEY_OPTIONS, RECORDING_STATES } from '../config/constants';
import '../styles/Home.css';

/**
 * Presentation Layer - Main Home Page
 */
const HomePageContent = ({ onLogoutProp }) => {
  const appState = useAppState();
  const [showSettings, setShowSettings] = useState(false);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [recordingsRefreshKey, setRecordingsRefreshKey] = useState(0);
  const [micTestSecondsLeft, setMicTestSecondsLeft] = useState(0);
  const lastNonEmptyTranscriptRef = useRef('');
  const [saveStatus, setSaveStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Use onLogout from context if available, otherwise use the prop
  const onLogout = appState?.onLogout || onLogoutProp;
  

  const {
    recordingState,
    setRecordingState,
    lastTranscript,
    setLastTranscript,
    interimTranscript,
    setInterimTranscript,
    settings,
    updateSettings,
    userId
  } = appState;

  const handleTranscript = (data) => {
    if (data.event === 'interim_transcript') {
      if (data.transcript && data.transcript.trim()) {
        lastNonEmptyTranscriptRef.current = data.transcript.trim();
      }
      setInterimTranscript(data.transcript);
    } else if (data.event === 'final_transcript') {
      const finalText = (data.transcript || '').trim();
      const resolvedTranscript = finalText || lastNonEmptyTranscriptRef.current;
      setLastTranscript(resolvedTranscript || data.transcript);
      setRecordingState(RECORDING_STATES.IDLE);
      setIsOverlayVisible(false);

      setSaveStatus('');
      lastNonEmptyTranscriptRef.current = '';
    } else if (data.event === 'error') {
      console.error('Transcription error:', data.error);
      setRecordingState(RECORDING_STATES.IDLE);
      setIsOverlayVisible(false);
    }
  };

  const { error, startRecording, stopRecording, audioLevel } = useAudioRecorder(handleTranscript);

  const startRecordingFlow = useCallback(async () => {
    if (recordingState !== RECORDING_STATES.IDLE || !settings?.deepgramApiKey) {
      if (!settings?.deepgramApiKey) {
        console.error('❌ Cannot start recording: No Deepgram API key configured');
      }
      return;
    }

    const micTestEnabled = settings?.micTestEnabled ?? true;
    setRecordingState(micTestEnabled ? RECORDING_STATES.TESTING : RECORDING_STATES.RECORDING);
    setIsOverlayVisible(true);
    setMicTestSecondsLeft(micTestEnabled ? 2 : 0);

    const apiKey = settings.deepgramApiKey;
    const model = settings.deepgramModel || 'nova-2';
    const language = settings.deepgramLanguage || 'en';

    try {
      await startRecording(apiKey, model, language, {
        micTestEnabled,
        preMuteDelayMs: settings?.preMuteDelayMs ?? 150,
        deviceId: settings?.microphoneDeviceId || ''
      });
      setRecordingState(RECORDING_STATES.RECORDING);
    } catch (err) {
      setRecordingState(RECORDING_STATES.IDLE);
      setIsOverlayVisible(false);
    }
  }, [recordingState, settings, startRecording, setIsOverlayVisible, setMicTestSecondsLeft, setRecordingState]);

  const stopRecordingFlow = useCallback(() => {
    if (recordingState === RECORDING_STATES.TESTING) {
      setRecordingState(RECORDING_STATES.IDLE);
      setIsOverlayVisible(false);
      return;
    }

    if (recordingState !== RECORDING_STATES.RECORDING) {
      return;
    }

    setRecordingState(RECORDING_STATES.TRANSCRIBING);
    stopRecording().catch(err => {
      console.error('Error stopping recording:', err);
      setRecordingState(RECORDING_STATES.IDLE);
      setIsOverlayVisible(false);
    });
  }, [recordingState, stopRecording, setIsOverlayVisible, setRecordingState]);

  const handleSaveTranscript = async (finalText) => {
    if (!finalText || !finalText.trim() || !userId || !settings) {
      return;
    }

    try {
      setIsSaving(true);
      setSaveStatus('');

      const recordingData = {
        // Transcripts
        originalTranscript: finalText.trim(),

        // Model & Language (matching what was used)
        deepgramModel: settings?.deepgramModel || 'nova-2',
        deepgramLanguage: settings?.deepgramLanguage || 'en',
        groqModel: settings?.groqModel || 'mixtral-8x7b-32768',

        // Processing options (exact same structure as vocal)
        processingOptions: settings?.processingOptions || {
          spelling: false,
          grammar: false,
          codeMix: false,
          codeMixLanguage: 'Hinglish',
          targetLanguage: false,
          targetLanguageValue: 'en'
        },

        // API keys needed for post-processing
        deepgramApiKey: settings?.deepgramApiKey,
        groqApiKey: settings?.groqApiKey,

        // Duration in milliseconds (calculated from timestamp)
        duration: 0,

        // Audio format (always 16kHz mono PCM16 to match vocal)
        audioFormat: 'PCM16',
        sampleRate: 16000
      };

      const result = await RecordingAPIService.saveRecording(userId, recordingData);
      const saved = result?.data || result;
      console.log('✓ Recording saved:', saved?._id || 'ok');
      setRecordingsRefreshKey((prev) => prev + 1);
      setSaveStatus('Saved to history.');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (err) {
      setSaveStatus(err.message || 'Failed to save recording.');
    } finally {
      setIsSaving(false);
    }
  };

  // Safety timeout: if transcribing for more than 30 seconds, force back to IDLE
  useEffect(() => {
    if (recordingState === RECORDING_STATES.TRANSCRIBING) {
      const timeoutId = setTimeout(() => {
        console.warn('⏱️ Transcription timeout - forcing return to IDLE');
        setRecordingState(RECORDING_STATES.IDLE);
        setIsOverlayVisible(false);
      }, 30000); // 30 second timeout

      return () => clearTimeout(timeoutId);
    }
  }, [recordingState, setRecordingState]);

  // Check permissions on component mount
  useEffect(() => {
    const checkPermissions = async () => {
      const perms = await PermissionsManager.checkAllPermissions();
      if (!perms.microphone) {
        PermissionsManager.showPermissionAlert(
          'Microphone Permission Required',
          'VocalFlow needs microphone access to record your speech.'
        );
      }
    };
    checkPermissions();
  }, []);

  useEffect(() => {
    if (!settings) return;

    const hotkeyValue = settings?.hotkey || 'rightOption';

    const isMatchingHotkey = (event) => {
      const codeMap = {
        rightOption: 'AltRight',
        leftOption: 'AltLeft',
        rightCommand: 'MetaRight',
        leftCommand: 'MetaLeft',
        fn: 'Fn'
      };
      const expectedCode = codeMap[hotkeyValue];

      if (expectedCode && event.code === expectedCode) {
        return true;
      }

      if (hotkeyValue === 'rightOption' || hotkeyValue === 'leftOption') {
        if (hotkeyValue === 'rightOption' && event.key === 'AltGraph') {
          return true;
        }
        if (event.key === 'Alt') {
          return hotkeyValue === 'rightOption' ? event.location === 2 : event.location === 1;
        }
      }

      if (hotkeyValue === 'rightCommand' || hotkeyValue === 'leftCommand') {
        if (event.key === 'Meta') {
          return hotkeyValue === 'rightCommand' ? event.location === 2 : event.location === 1;
        }
      }

      return false;
    };

    const handleKeyDown = async (e) => {
      // Start recording: configured hotkey
      if (isMatchingHotkey(e) && recordingState === RECORDING_STATES.IDLE) {
        e.preventDefault();
        console.log('🎙️ Starting recording from hotkey');
        await startRecordingFlow();
      }
    };

    const handleKeyUp = async (e) => {
      // Cancel mic test on release
      if (isMatchingHotkey(e) && recordingState === RECORDING_STATES.TESTING) {
        e.preventDefault();
        stopRecordingFlow();
        return;
      }

      // Stop recording: hotkey release
      if (isMatchingHotkey(e) && recordingState === RECORDING_STATES.RECORDING) {
        e.preventDefault();
        console.log('⏹️ Stop key pressed, transitioning to TRANSCRIBING');
        stopRecordingFlow();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [settings, recordingState, startRecordingFlow, stopRecordingFlow]);

  useEffect(() => {
    const handleVisibilityOrBlur = () => {
      if (recordingState === RECORDING_STATES.TESTING) {
        setRecordingState(RECORDING_STATES.IDLE);
        setIsOverlayVisible(false);
        return;
      }

      if (recordingState === RECORDING_STATES.RECORDING) {
        setRecordingState(RECORDING_STATES.TRANSCRIBING);
        stopRecording().catch(err => {
          console.error('Error stopping recording on blur:', err);
          setRecordingState(RECORDING_STATES.IDLE);
          setIsOverlayVisible(false);
        });
      }
    };

    const handleBlur = () => {
      handleVisibilityOrBlur();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleVisibilityOrBlur();
      }
    };

    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [recordingState, stopRecording, setRecordingState]);

  useEffect(() => {
    if (recordingState !== RECORDING_STATES.TESTING) {
      return;
    }

    if (micTestSecondsLeft <= 0) {
      return;
    }

    const timerId = setInterval(() => {
      setMicTestSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timerId);
  }, [recordingState, micTestSecondsLeft]);

  return (
    <div className="home-page">
      <MenuBar recordingState={recordingState} onOpenSettings={() => setShowSettings(true)} onLogout={onLogout} />

      {/* Recording Hotkey Instructions */}
      <div className="hotkey-hint">
        <small>
          🎤 Press <kbd>{HOTKEY_OPTIONS.find((option) => option.value === (settings?.hotkey || 'rightOption'))?.label || 'Right Option'}</kbd> to record • Release to stop
        </small>
      </div>

      <div
        className={`mobile-recorder ${recordingState === RECORDING_STATES.RECORDING ? 'is-recording' : ''}`}
        style={{ '--level': Math.max(0, Math.min(1, audioLevel)) }}
      >
        <div className="mobile-recorder-card">
          <div className="mobile-recorder-info">
            <div className="mobile-title">Quick Record</div>
            <div className="mobile-subtitle">
              {recordingState === RECORDING_STATES.RECORDING && 'Listening...'}
              {recordingState === RECORDING_STATES.TRANSCRIBING && 'Transcribing...'}
              {recordingState === RECORDING_STATES.TESTING && `Testing mic${micTestSecondsLeft > 0 ? ` • ${micTestSecondsLeft}s` : ''}`}
              {recordingState === RECORDING_STATES.IDLE && 'Tap to start recording'}
            </div>
          </div>
          <button
            className={`mic-button ${recordingState === RECORDING_STATES.RECORDING ? 'active' : ''}`}
            onClick={() => {
              if (!settings?.deepgramApiKey) {
                console.error('❌ Cannot start recording: No Deepgram API key configured');
                return;
              }

              if (recordingState === RECORDING_STATES.IDLE) {
                startRecordingFlow();
                return;
              }

              stopRecordingFlow();
            }}
            disabled={recordingState === RECORDING_STATES.TRANSCRIBING}
            title={recordingState === RECORDING_STATES.RECORDING ? 'Stop recording' : 'Start recording'}
          >
            <span className="mic-rings" aria-hidden="true">
              <span className="ring ring-1" />
              <span className="ring ring-2" />
              <span className="ring ring-3" />
            </span>
            <span className="mic-core">🎤</span>
            <span className="mic-label">
              {recordingState === RECORDING_STATES.RECORDING ? 'Tap to stop' : 'Tap to speak'}
            </span>
          </button>
        </div>
      </div>

      <RecordingOverlay 
        isVisible={isOverlayVisible} 
        recordingState={recordingState}
        audioLevel={audioLevel}
        micTestSecondsLeft={micTestSecondsLeft}
        onStop={() => {
          console.log('⏹️ Stop button pressed');
          stopRecordingFlow();
        }}
      />

      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowSettings(false)}>✕</button>
            <SettingsView
              userId={userId}
              settings={settings}
              onSettingsUpdate={updateSettings}
              deepgramModels={appState.deepgramModels}
              groqModels={appState.groqModels}
              onFetchDeepgramModels={(models) => appState.setDeepgramModels?.(models)}
              onFetchGroqModels={(models) => appState.setGroqModels?.(models)}
            />
          </div>
        </div>
      )}

      <main className="content">
        <TranscriptDisplay
          interim={interimTranscript}
          final={lastTranscript}
          isProcessing={recordingState === RECORDING_STATES.TRANSCRIBING}
          onSave={handleSaveTranscript}
          saveStatus={saveStatus}
          isSaving={isSaving}
        />

        {error && <div className="error-message">{error}</div>}

        <RecordingsList userId={userId} refreshKey={recordingsRefreshKey} />
      </main>
    </div>
  );
};

/**
 * Main Home Page with Provider
 */
const HomePage = ({ onLogout }) => {
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use authenticated userId from AuthService (from JWT token)
    const authenticatedUserId = AuthService.getUserId();
    if (authenticatedUserId) {
      setUserId(authenticatedUserId);
    }
    setLoading(false);
  }, []);

  if (loading) return <div className="App loading"><div className="spinner">Loading...</div></div>;
  if (!userId) return <div className="App loading"><div className="spinner">Authentication required</div></div>;

  return (
    <AppProvider userId={userId} onLogout={onLogout}>
      <HomePageContent onLogoutProp={onLogout} />
    </AppProvider>
  );
};

export default HomePage;
