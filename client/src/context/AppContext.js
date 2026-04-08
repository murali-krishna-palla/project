import React, { createContext, useState, useCallback, useEffect } from 'react';
import SettingsAPIService from '../services/settingsAPI';

/**
 * Business Logic Layer - App Context/State Management
 */
export const AppContext = createContext();

export const AppProvider = ({ children, userId }) => {
  const [recordingState, setRecordingState] = useState('idle');
  const [lastTranscript, setLastTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [settings, setSettingsState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deepgramModels, setDeepgramModels] = useState([]);
  const [groqModels, setGroqModels] = useState([]);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await SettingsAPIService.getSettings(userId);
        setSettingsState(data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load settings:', err);
        setLoading(false);
      }
    };

    if (userId) {
      loadSettings();
    }
  }, [userId]);

  const updateSettings = useCallback(async (newSettings) => {
    try {
      const updated = await SettingsAPIService.updateSettings(userId, newSettings);
      setSettingsState(updated);
    } catch (err) {
      console.error('Failed to update settings:', err);
    }
  }, [userId]);

  const fetchModels = useCallback(async () => {
    if (!settings?.deepgramApiKey) return;

    try {
      const { models } = await SettingsAPIService.fetchDeepgramModels(
        settings.deepgramApiKey
      );
      setDeepgramModels(models || []);
    } catch (err) {
      console.error('Failed to fetch models:', err);
    }
  }, [settings?.deepgramApiKey]);

  const fetchGroqModelsData = useCallback(async () => {
    if (!settings?.groqApiKey) return;

    try {
      const { models } = await SettingsAPIService.fetchGroqModels(
        settings.groqApiKey
      );
      setGroqModels(models || []);
    } catch (err) {
      console.error('Failed to fetch Groq models:', err);
    }
  }, [settings?.groqApiKey]);

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
    userId
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
