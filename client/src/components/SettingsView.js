import React, { useState, useEffect } from 'react';
import SettingsAPIService from '../services/settingsAPI';
import '../styles/SettingsView.css';

/**
 * Presentation Layer - Settings View Component
 * Matches original VocalFlow SettingsView.swift exactly
 */
const SettingsView = ({
  userId,
  settings,
  onSettingsUpdate,
  deepgramModels = [],
  groqModels = [],
  onFetchDeepgramModels,
  onFetchGroqModels
}) => {
  // Local state for form inputs (not saved yet)
  const [apiKeyInput, setApiKeyInput] = useState(settings?.deepgramApiKey || '');
  const [groqKeyInput, setGroqKeyInput] = useState(settings?.groqApiKey || '');
  
  // UI state
  const [showApiKey, setShowApiKey] = useState(false);
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [groqSaveStatus, setGroqSaveStatus] = useState('');
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [isFetchingGroqModels, setIsFetchingGroqModels] = useState(false);
  const [modelFetchError, setModelFetchError] = useState('');
  const [groqModelFetchError, setGroqModelFetchError] = useState('');
  const [deepgramBalance, setDeepgramBalance] = useState(null);
  const [groqBalance, setGroqBalance] = useState(null);
  const [isFetchingDeepgramBalance, setIsFetchingDeepgramBalance] = useState(false);
  const [isFetchingGroqBalance, setIsFetchingGroqBalance] = useState(false);
  const [deepgramBalanceError, setDeepgramBalanceError] = useState('');
  const [groqBalanceError, setGroqBalanceError] = useState('');

  // Sync inputs with settings when they change
  useEffect(() => {
    setApiKeyInput(settings?.deepgramApiKey || '');
    setGroqKeyInput(settings?.groqApiKey || '');
  }, [settings]);

  // Save Deepgram API Key
  const handleSaveDeepgramKey = async () => {
    try {
      setSaveStatus('');
      const updated = await SettingsAPIService.updateSettings(userId, {
        ...settings,
        deepgramApiKey: apiKeyInput
      });
      onSettingsUpdate(updated);
      setSaveStatus('✓ Saved!');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (err) {
      setSaveStatus('❌ Failed to save');
    }
  };

  // Save Groq API Key
  const handleSaveGroqKey = async () => {
    try {
      setGroqSaveStatus('');
      const updated = await SettingsAPIService.updateSettings(userId, {
        ...settings,
        groqApiKey: groqKeyInput
      });
      onSettingsUpdate(updated);
      setGroqSaveStatus('✓ Saved!');
      setTimeout(() => setGroqSaveStatus(''), 2000);
    } catch (err) {
      setGroqSaveStatus('❌ Failed to save');
    }
  };

  // Fetch Deepgram Models
  const handleFetchDeepgramModels = async () => {
    if (!apiKeyInput) {
      setModelFetchError('Enter API key first');
      return;
    }

    setIsFetchingModels(true);
    setModelFetchError('');
    
    try {
      const { models } = await SettingsAPIService.fetchDeepgramModels(apiKeyInput);
      
      if (!models || models.length === 0) {
        setModelFetchError('Could not fetch models. Check your API key.');
      } else {
        onFetchDeepgramModels(models);
      }
    } catch (err) {
      setModelFetchError('Failed to fetch models: ' + err.message);
    } finally {
      setIsFetchingModels(false);
    }
  };

  // Fetch Groq Models
  const handleFetchGroqModels = async () => {
    if (!groqKeyInput) {
      setGroqModelFetchError('Enter API key first');
      return;
    }

    setIsFetchingGroqModels(true);
    setGroqModelFetchError('');
    
    try {
      const { models } = await SettingsAPIService.fetchGroqModels(groqKeyInput);
      
      if (!models || models.length === 0) {
        setGroqModelFetchError('Could not fetch models. Check your API key.');
      } else {
        onFetchGroqModels(models);
      }
    } catch (err) {
      setGroqModelFetchError('Failed to fetch models: ' + err.message);
    } finally {
      setIsFetchingGroqModels(false);
    }
  };

  // Fetch Deepgram Balance
  const handleFetchDeepgramBalance = async () => {
    if (!apiKeyInput) {
      setDeepgramBalanceError('Enter API key first');
      return;
    }

    setIsFetchingDeepgramBalance(true);
    setDeepgramBalanceError('');
    setDeepgramBalance(null);
    
    try {
      // Retry logic: try up to 2 times if it fails
      let lastError = null;
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          console.log(`Deepgram balance fetch - Attempt ${attempt}`);
          const balance = await SettingsAPIService.getDeepgramBalance(apiKeyInput);
          setDeepgramBalance(balance);
          console.log('✓ Deepgram balance fetched successfully');
          setIsFetchingDeepgramBalance(false);
          return;
        } catch (err) {
          lastError = err;
          console.warn(`Attempt ${attempt} failed:`, err.message);
          if (attempt < 2) {
            // Wait 500ms before retrying
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
      
      // If both attempts failed
      throw lastError;
    } catch (err) {
      setDeepgramBalanceError('Failed to fetch balance: ' + err.message);
    } finally {
      setIsFetchingDeepgramBalance(false);
    }
  };

  // Fetch Groq Balance
  const handleFetchGroqBalance = async () => {
    if (!groqKeyInput) {
      setGroqBalanceError('Enter API key first');
      return;
    }

    setIsFetchingGroqBalance(true);
    setGroqBalanceError('');
    setGroqBalance(null);
    
    try {
      const balance = await SettingsAPIService.getGroqBalance(groqKeyInput);
      setGroqBalance(balance);
    } catch (err) {
      setGroqBalanceError('Failed to fetch balance: ' + err.message);
    } finally {
      setIsFetchingGroqBalance(false);
    }
  };

  // Save all processing options
  const handleUpdateProcessingOptions = async (options) => {
    try {
      const updatedSettings = {
        ...settings,
        processingOptions: {
          ...settings?.processingOptions,
          spelling: options.spelling !== undefined ? options.spelling : settings?.processingOptions?.spelling,
          grammar: options.grammar !== undefined ? options.grammar : settings?.processingOptions?.grammar,
          codeMix: options.codeMix !== undefined ? options.codeMix : settings?.processingOptions?.codeMix,
          codeMixLanguage: options.codeMixLanguage || settings?.processingOptions?.codeMixLanguage,
          targetLanguage: options.targetLanguage !== undefined ? options.targetLanguage : settings?.processingOptions?.targetLanguage,
          targetLanguageValue: options.targetLanguageValue || settings?.processingOptions?.targetLanguageValue
        }
      };
      const updated = await SettingsAPIService.updateSettings(userId, updatedSettings);
      onSettingsUpdate(updated);
    } catch (err) {
      console.error('Failed to update settings:', err);
    }
  };

  return (
    <div className="settings-view">
      <h2>VocalFlow Settings</h2>

      {/* ===== DEEPGRAM SECTION ===== */}
      <section className="settings-section">
        <div className="section-header">
          <h3>Deepgram (Speech-to-Text)</h3>
          <button 
            className="fetch-models-btn"
            onClick={handleFetchDeepgramModels}
            disabled={isFetchingModels || !apiKeyInput}
          >
            {isFetchingModels ? '⏳ Fetching...' : 'Fetch Models'}
          </button>
        </div>

        <div className="form-group">
          <label>API Key</label>
          <div className="api-key-input">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="Enter your Deepgram API key"
            />
            <button className="show-toggle" onClick={() => setShowApiKey(!showApiKey)}>
              {showApiKey ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          <a href="https://console.deepgram.com/signup" target="_blank" rel="noreferrer" className="get-key-link">
            Get a free API key →
          </a>
        </div>

        <div className="button-group">
          <button className="save-btn" onClick={handleSaveDeepgramKey}>
            Save
          </button>
          {saveStatus && <span className={`status ${saveStatus.includes('✓') ? 'success' : 'error'}`}>{saveStatus}</span>}
        </div>

        {modelFetchError && <div className="error-message">{modelFetchError}</div>}

        {deepgramModels.length > 0 && (
          <div className="form-group">
            <label>Model</label>
            <select 
              value={settings?.deepgramModel || 'nova-2'}
              onChange={async (e) => {
                const updated = await SettingsAPIService.updateSettings(userId, {
                  ...settings,
                  deepgramModel: e.target.value
                });
                onSettingsUpdate(updated);
              }}
            >
              {/* Deduplicate models by canonicalName to prevent React key warnings */}
              {Array.from(
                new Map(deepgramModels.map(m => [m.canonicalName, m])).values()
              ).map((model, index) => (
                <option key={`deepgram-${model.canonicalName}-${index}`} value={model.canonicalName}>
                  {model.displayName || model.canonicalName}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="form-group">
          <label>Language</label>
          <select 
            value={settings?.deepgramLanguage || 'en'}
            onChange={async (e) => {
              const updated = await SettingsAPIService.updateSettings(userId, {
                ...settings,
                deepgramLanguage: e.target.value
              });
              onSettingsUpdate(updated);
            }}
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="it">Italian</option>
            <option value="pt">Portuguese</option>
            <option value="ru">Russian</option>
            <option value="ja">Japanese</option>
            <option value="ko">Korean</option>
            <option value="zh">Chinese</option>
            <option value="hi">Hindi</option>
            <option value="ar">Arabic</option>
          </select>
        </div>

        <div className="button-group">
          <button 
            className="fetch-models-btn"
            onClick={handleFetchDeepgramBalance}
            disabled={isFetchingDeepgramBalance || !apiKeyInput}
          >
            {isFetchingDeepgramBalance ? '⏳ Checking...' : '💰 Show Balance'}
          </button>
        </div>

        {deepgramBalanceError && <div className="error-message">{deepgramBalanceError}</div>}

        {deepgramBalance && (
          <div className={`balance-card ${deepgramBalance.status}`}>
            <h4>💳 Deepgram Account</h4>
            {deepgramBalance.status === 'success' ? (
              <>
                <p><strong>Project:</strong> {deepgramBalance.projectName}</p>
                <p><strong>Project ID:</strong> <code>{deepgramBalance.projectId}</code></p>
                
                {deepgramBalance.balance && deepgramBalance.balance !== 'N/A' && (
                  <p><strong>Balance:</strong> ${deepgramBalance.balance}</p>
                )}
                {deepgramBalance.creditBalance && deepgramBalance.creditBalance !== 'N/A' && (
                  <p><strong>Credit Balance:</strong> ${deepgramBalance.creditBalance}</p>
                )}
                {deepgramBalance.totalRequests !== undefined && (
                  <p><strong>Total Requests:</strong> {deepgramBalance.totalRequests}</p>
                )}
                {deepgramBalance.totalHours !== undefined && (
                  <p><strong>Total Hours Processed:</strong> {deepgramBalance.totalHours.toFixed(2)}h</p>
                )}
                {deepgramBalance.requestCount !== undefined && (
                  <p><strong>Request Count:</strong> {deepgramBalance.requestCount}</p>
                )}
                {deepgramBalance.startTime && deepgramBalance.endTime && (
                  <p><strong>Period:</strong> {new Date(deepgramBalance.startTime).toLocaleDateString()} - {new Date(deepgramBalance.endTime).toLocaleDateString()}</p>
                )}
                
                {deepgramBalance.message && (
                  <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                    {deepgramBalance.message}
                  </p>
                )}
              </>
            ) : deepgramBalance.status === 'partial' ? (
              <>
                <p><strong>Project:</strong> {deepgramBalance.projectName}</p>
                <p><strong>Project ID:</strong> <code>{deepgramBalance.projectId}</code></p>
                <div style={{ background: '#fff3cd', padding: '10px', borderRadius: '4px', marginTop: '10px' }}>
                  <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#856404' }}>⚠️ Balance access requires API key update</p>
                  <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#856404' }}>
                    Your API key needs additional scopes to view balance. Follow these steps:
                  </p>
                  <ol style={{ margin: '5px 0', paddingLeft: '20px', fontSize: '12px', color: '#856404' }}>
                    <li>Go to <a href="https://console.deepgram.com" target="_blank" rel="noreferrer" style={{ color: '#0066cc' }}>console.deepgram.com</a></li>
                    <li>Go to Settings → API Keys</li>
                    <li>Click your API key to edit</li>
                    <li>Enable scopes: <code>project:read</code> and <code>usage:read</code></li>
                    <li>Regenerate and update your key here</li>
                  </ol>
                </div>
              </>
            ) : (
              <p>{deepgramBalance.message}</p>
            )}
          </div>
        )}
      </section>

      {/* ===== GROQ SECTION ===== */}
      <section className="settings-section">
        <div className="section-header">
          <h3>Groq (Post-Processing)</h3>
          <button 
            className="fetch-models-btn"
            onClick={handleFetchGroqModels}
            disabled={isFetchingGroqModels || !groqKeyInput}
          >
            {isFetchingGroqModels ? '⏳ Fetching...' : 'Fetch Models'}
          </button>
        </div>

        <div className="form-group">
          <label>API Key</label>
          <div className="api-key-input">
            <input
              type={showGroqKey ? 'text' : 'password'}
              value={groqKeyInput}
              onChange={(e) => setGroqKeyInput(e.target.value)}
              placeholder="Enter your Groq API key (Optional)"
            />
            <button className="show-toggle" onClick={() => setShowGroqKey(!showGroqKey)}>
              {showGroqKey ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          <a href="https://console.groq.com" target="_blank" rel="noreferrer" className="get-key-link">
            Get a free API key →
          </a>
        </div>

        <div className="button-group">
          <button className="save-btn" onClick={handleSaveGroqKey}>
            Save
          </button>
          {groqSaveStatus && <span className={`status ${groqSaveStatus.includes('✓') ? 'success' : 'error'}`}>{groqSaveStatus}</span>}
        </div>

        {groqModelFetchError && <div className="error-message">{groqModelFetchError}</div>}

        {groqModels.length > 0 && (
          <div className="form-group">
            <label>Model</label>
            <select 
              value={settings?.groqModel || ''}
              onChange={async (e) => {
                const updated = await SettingsAPIService.updateSettings(userId, {
                  ...settings,
                  groqModel: e.target.value
                });
                onSettingsUpdate(updated);
              }}
            >
              {/* Deduplicate models by id to prevent React key warnings */}
              {Array.from(
                new Map(groqModels.map(m => [m.id, m])).values()
              ).map((model, index) => (
                <option key={`groq-${model.id}-${index}`} value={model.id}>
                  {model.id}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="button-group">
          <button 
            className="fetch-models-btn"
            onClick={handleFetchGroqBalance}
            disabled={isFetchingGroqBalance || !groqKeyInput}
          >
            {isFetchingGroqBalance ? '⏳ Checking...' : '💰 Show Balance'}
          </button>
        </div>

        {groqBalanceError && <div className="error-message">{groqBalanceError}</div>}

        {groqBalance && (
          <div className={`balance-card ${groqBalance.status}`}>
            <h4>💳 Groq Account</h4>
            {groqBalance.status === 'success' ? (
              <>
                {groqBalance.username && (
                  <p><strong>User:</strong> {groqBalance.username}</p>
                )}
                {groqBalance.email && (
                  <p><strong>Email:</strong> {groqBalance.email}</p>
                )}
                <p><strong>Available Models:</strong> {groqBalance.modelsAvailable}</p>
                <p><strong>Sample Models:</strong></p>
                <ul style={{ paddingLeft: '20px', fontSize: '12px' }}>
                  {groqBalance.models && groqBalance.models.map((model, idx) => (
                    <li key={idx}>{model.id} (<em>{model.owner}</em>)</li>
                  ))}
                </ul>
                {groqBalance.message && (
                  <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                    {groqBalance.message}
                  </p>
                )}
              </>
            ) : (
              <p>{groqBalance.message}</p>
            )}
          </div>
        )}
      </section>

      {/* ===== TEXT PROCESSING OPTIONS ===== */}
      <section className="settings-section">
        <h3>Text Processing Options</h3>

        <div className="checkbox-group">
          <input
            type="checkbox"
            id="spelling"
            checked={settings?.processingOptions?.spelling || false}
            onChange={(e) => handleUpdateProcessingOptions({ spelling: e.target.checked })}
          />
          <label htmlFor="spelling">Enable Spelling Correction</label>
        </div>

        <div className="checkbox-group">
          <input
            type="checkbox"
            id="grammar"
            checked={settings?.processingOptions?.grammar || false}
            onChange={(e) => handleUpdateProcessingOptions({ grammar: e.target.checked })}
          />
          <label htmlFor="grammar">Enable Grammar Correction</label>
        </div>

        <div className="checkbox-group">
          <input
            type="checkbox"
            id="codemix"
            checked={settings?.processingOptions?.codeMix || false}
            onChange={(e) => handleUpdateProcessingOptions({ codeMix: e.target.checked })}
          />
          <label htmlFor="codemix">Enable Code-Mix</label>
          
          {settings?.processingOptions?.codeMix && (
            <div className="nested-select">
              <select 
                value={settings?.processingOptions?.codeMixLanguage || 'Hinglish'}
                onChange={(e) => handleUpdateProcessingOptions({ codeMixLanguage: e.target.value })}
              >
                <option value="Hinglish">Hinglish (Hindi + English)</option>
                <option value="Tanglish">Tanglish (Tamil + English)</option>
                <option value="Benglish">Benglish (Bengali + English)</option>
                <option value="Kanglish">Kanglish (Kannada + English)</option>
                <option value="Spanglish">Spanglish (Spanish + English)</option>
                <option value="Franglais">Franglais (French + English)</option>
              </select>
            </div>
          )}
        </div>

        <div className="checkbox-group">
          <input
            type="checkbox"
            id="translation"
            checked={settings?.processingOptions?.targetLanguage || false}
            onChange={(e) => handleUpdateProcessingOptions({ targetLanguage: e.target.checked })}
          />
          <label htmlFor="translation">Enable Translation</label>
          
          {settings?.processingOptions?.targetLanguage && (
            <div className="nested-select">
              <select 
                value={settings?.processingOptions?.targetLanguageValue || 'en'}
                onChange={(e) => handleUpdateProcessingOptions({ targetLanguageValue: e.target.value })}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="ja">Japanese</option>
                <option value="hi">Hindi</option>
              </select>
            </div>
          )}
        </div>
      </section>

      {/* ===== PERMISSIONS SECTION ===== */}
      <section className="settings-section">
        <h3>Permissions</h3>
        <div className="permission-item">
          <span>🎤 Microphone</span>
          <span className="permission-status">Required for audio capture</span>
        </div>
        <div className="permission-item">
          <span>📋 Clipboard</span>
          <span className="permission-status">Will request access on first use</span>
        </div>
      </section>

      {/* ===== ABOUT SECTION ===== */}
      <section className="settings-section">
        <h3>About</h3>
        <p><strong>VocalFlow v1.0.0</strong></p>
        <p>Voice-to-text transcription with AI post-processing</p>
        <p style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>
          Backed by Deepgram ASR and Groq LLM
        </p>
      </section>
    </div>
  );
};

export default SettingsView;
