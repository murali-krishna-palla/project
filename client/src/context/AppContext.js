import React, { createContext, useState, useCallback, useEffect } from 'react';
import SettingsAPIService from '../services/settingsAPI';
import AuthService from '../services/authAPI';

/**
 * Business Logic Layer - App Context/State Management
 */
export const AppContext = createContext();

// Validate MongoDB ObjectId format (24 hex characters)
function isValidMongoId(id) {
  return /^[0-9a-f]{24}$/.test(id?.toLowerCase() || '');
}

export const AppProvider = ({ children, userId, onLogout }) => {
  const [recordingState, setRecordingState] = useState('idle');
  const [lastTranscript, setLastTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [settings, setSettingsState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deepgramModels, setDeepgramModels] = useState([]);
  const [groqModels, setGroqModels] = useState([]);


  // Handle 401 errors (token invalid/expired)
  const handleAuthError = useCallback((error) => {
    if (error.message && error.message.includes('401')) {
      console.warn('Authentication expired, logging out...');
      AuthService.logout();
      onLogout?.();
    }
  }, [onLogout]);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await SettingsAPIService.getSettings(userId);
        setSettingsState(data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load settings:', err);
        if (err.message?.includes('401')) {
          handleAuthError(err);
        }
        setLoading(false);
      }
    };

    // Only load if userId is valid MongoDB ObjectId
    if (userId && isValidMongoId(userId)) {
      loadSettings();
    } else if (userId) {
      // Invalid userId format - mark as not loading since we can't fetch
      console.warn('Invalid userId format, skipping settings load:', userId);
      setLoading(false);
    }
  }, [userId, handleAuthError]);

  const updateSettings = useCallback(async (newSettings) => {
    try {
      const updated = await SettingsAPIService.updateSettings(userId, newSettings);
      setSettingsState(updated);
      return updated;
    } catch (err) {
      console.error('Failed to update settings:', err);
      if (err.message?.includes('401')) {
        handleAuthError(err);
      }
      throw err;
    }
  }, [userId, handleAuthError]);

  const fetchModels = useCallback(async () => {
    if (!settings?.deepgramApiKey) return;

    try {
      const { models } = await SettingsAPIService.fetchDeepgramModels(
        settings.deepgramApiKey
      );
      setDeepgramModels(models || []);
    } catch (err) {
      console.error('Failed to fetch models:', err);
      if (err.message?.includes('401')) {
        handleAuthError(err);
      }
    }
  }, [settings?.deepgramApiKey, handleAuthError]);

  const fetchGroqModelsData = useCallback(async () => {
    if (!settings?.groqApiKey) return;

    try {
      const { models } = await SettingsAPIService.fetchGroqModels(
        settings.groqApiKey
      );
      setGroqModels(models || []);
    } catch (err) {
      console.error('Failed to fetch Groq models:', err);
      if (err.message?.includes('401')) {
        handleAuthError(err);
      }
    }
  }, [settings?.groqApiKey, handleAuthError]);

  const value = {
    recordingState,
    setRecordingState,
    lastTranscript,
    setLastTranscript,
    interimTranscript,
    setInterimTranscript,
    settings,
    updateSettings,
    loading,
    deepgramModels,
    setDeepgramModels,
    groqModels,
    setGroqModels,
    fetchModels,
    fetchGroqModelsData,
    userId,
    onLogout
  };


  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
