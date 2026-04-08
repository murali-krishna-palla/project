import React, { useState, useEffect } from 'react';
import { AppProvider } from '../context/AppContext';
import { useAppState } from '../hooks/useApp';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import PermissionsManager from '../services/permissionsManager';
import MenuBar from '../components/MenuBar';
import RecordingOverlay from '../components/RecordingOverlay';
import SettingsView from '../components/SettingsView';
import TranscriptDisplay from '../components/TranscriptDisplay';
import RecordingsList from '../components/RecordingsList';
import RecordingAPIService from '../services/recordingAPI';
import { RECORDING_STATES } from '../config/constants';
import '../styles/Home.css';

/**
 * Presentation Layer - Main Home Page
 */
const HomePageContent = () => {
  const appState = useAppState();
  const [showSettings, setShowSettings] = useState(false);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [processingOptions, setProcessingOptions] = useState({});

  const {
    recordingState,
    setRecordingState,
    lastTranscript,
    setLastTranscript,
    interimTranscript,
    setInterimTranscript,
    settings,
    updateSettings,
    fetchModels,
    fetchGroqModelsData,
    userId
  } = appState;

  // Load processing options from settings
  useEffect(() => {
    if (settings?.processingOptions) {
      setProcessingOptions(settings.processingOptions);
    }
  }, [settings?.processingOptions]);

  const handleTranscript = (data) => {
    if (data.event === 'interim_transcript') {
      setInterimTranscript(data.transcript);
    } else if (data.event === 'final_transcript') {
      setLastTranscript(data.transcript);
      setRecordingState(RECORDING_STATES.IDLE);
      setIsOverlayVisible(false);

      // Save recording
      if (userId && data.transcript) {
        RecordingAPIService.saveRecording(userId, {
          originalTranscript: data.transcript,
          model: settings?.deepgramModel,
          language: settings?.deepgramLanguage,
          processingOptions: settings?.processingOptions || {},
          deepgramApiKey: settings?.deepgramApiKey,
          groqApiKey: settings?.groqApiKey,
          duration: 0
        }).catch(err => console.error('Failed to save recording:', err));
      }
    } else if (data.event === 'error') {
      console.error('Transcription error:', data.error);
      setRecordingState(RECORDING_STATES.IDLE);
      setIsOverlayVisible(false);
    }
  };

  const { isRecording, error, startRecording, stopRecording } = useAudioRecorder(handleTranscript);

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
  }, [recordingState]);

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

    const handleKeyDown = async (e) => {
      // Start recording: ALT key or spacebar
      if ((e.altKey || e.code === 'Space') && !recordingState.includes('recording')) {
        e.preventDefault();
        setRecordingState(RECORDING_STATES.RECORDING);
        setIsOverlayVisible(true);
        await startRecording(
          settings.deepgramApiKey,
          settings.deepgramModel,
          settings.deepgramLanguage
        );
      }
    };

    const handleKeyUp = async (e) => {
      // Stop recording: ALT key release, ENTER, or spacebar release
      if ((e.altKey || e.key === 'Enter' || e.code === 'Space') && recordingState === RECORDING_STATES.RECORDING) {
        e.preventDefault();
        console.log('⏹️ Stop key pressed, transitioning to TRANSCRIBING');
        setRecordingState(RECORDING_STATES.TRANSCRIBING);
        
        // Don't await - fire and forget so UI doesn't hang
        // The final transcript callback or 30s timeout will return to IDLE
        stopRecording().catch(err => {
          console.error('Error stopping recording:', err);
          setRecordingState(RECORDING_STATES.IDLE);
          setIsOverlayVisible(false);
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [settings, recordingState, startRecording, stopRecording, setRecordingState]);

  return (
    <div className="home-page">
      <MenuBar recordingState={recordingState} onOpenSettings={() => setShowSettings(true)} />

      {/* Recording Hotkey Instructions */}
      <div className="hotkey-hint">
        <small>
          🎤 Press <kbd>ALT</kbd> or <kbd>SPACEBAR</kbd> to record • Press <kbd>ENTER</kbd> or release key to stop
        </small>
      </div>

      <RecordingOverlay 
        isVisible={isOverlayVisible} 
        recordingState={recordingState}
        onStop={() => {
          console.log('⏹️ Stop button pressed');
          setRecordingState(RECORDING_STATES.TRANSCRIBING);
          stopRecording().catch(err => {
            console.error('Error stopping recording:', err);
            setRecordingState(RECORDING_STATES.IDLE);
            setIsOverlayVisible(false);
          });
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
        />

        {error && <div className="error-message">{error}</div>}

        <RecordingsList userId={userId} />
      </main>
    </div>
  );
};

/**
 * Main Home Page with Provider
 */
const HomePage = () => {
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // Get or create user ID
    let storedUserId = localStorage.getItem('userId');
    if (!storedUserId) {
      storedUserId = btoa(`user-${Date.now()}`);
      localStorage.setItem('userId', storedUserId);
    }
    setUserId(storedUserId);
  }, []);

  if (!userId) return <div>Loading...</div>;

  return (
    <AppProvider userId={userId}>
      <HomePageContent />
    </AppProvider>
  );
};

export default HomePage;
