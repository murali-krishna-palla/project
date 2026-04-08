import { useContext } from 'react';
import { AppContext } from '../context/AppContext';

/**
 * Business Logic Layer - Hook for App State
 */
export const useAppState = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppState must be used within AppProvider');
  }
  return context;
};

/**
 * Business Logic Layer - Hook for Recording
 */
export const useRecording = () => {
  const { recordingState, setRecordingState, lastTranscript, setLastTranscript } = useAppState();

  const startRecording = () => {
    setRecordingState('recording');
  };

  const stopRecording = () => {
    setRecordingState('transcribing');
  };

  const setError = (message) => {
    setRecordingState('error');
  };

  const reset = () => {
    setRecordingState('idle');
    setLastTranscript('');
  };

  return {
    recordingState,
    lastTranscript,
    startRecording,
    stopRecording,
    setError,
    reset
  };
};

/**
 * Business Logic Layer - Hook for Settings
 */
export const useSettings = () => {
  const { settings, updateSettings } = useAppState();

  const updateDeepgramSettings = (apiKey, model, language) => {
    updateSettings({
      ...settings,
      deepgramApiKey: apiKey,
      deepgramModel: model,
      deepgramLanguage: language
    });
  };

  const updateGroqSettings = (apiKey, model) => {
    updateSettings({
      ...settings,
      groqApiKey: apiKey,
      groqModel: model
    });
  };

  const updateProcessingOptions = (options) => {
    updateSettings({
      ...settings,
      processingOptions: {
        spelling: options.spelling || false,
        grammar: options.grammar || false,
        codeMix: options.codeMix || false,
        codeMixLanguage: options.codeMixLanguage || settings?.processingOptions?.codeMixLanguage,
        targetLanguage: options.targetLanguage || false,
        targetLanguageValue: options.targetLanguageValue || settings?.processingOptions?.targetLanguageValue
      }
    });
  };

  return {
    settings,
    updateDeepgramSettings,
    updateGroqSettings,
    updateProcessingOptions
  };
};
