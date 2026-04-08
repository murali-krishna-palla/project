const mongoose = require('mongoose');
const { encryptData, decryptData } = require('../utils/encryption');

/**
 * Data Access Layer - Settings Schema
 * Stores user API keys (encrypted), preferences, and model selections
 */
const settingsSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    
    // Deepgram Settings
    deepgramApiKey: {
      type: String,
      default: '',
      select: false, // Don't return by default for security
      get: function(value) {
        if (!value) return '';
        try {
          return decryptData(value);
        } catch (error) {
          // If decryption fails, assume it's plaintext
          console.warn('Failed to decrypt deepgramApiKey, assuming plaintext:', error.message);
          return value;
        }
      }
    },
    deepgramModel: {
      type: String,
      default: 'nova-2'
    },
    deepgramLanguage: {
      type: String,
      default: 'en'
    },
    
    // Groq Settings
    groqApiKey: {
      type: String,
      default: '',
      select: false, // Don't return by default for security
      get: function(value) {
        if (!value) return '';
        try {
          return decryptData(value);
        } catch (error) {
          // If decryption fails, assume it's plaintext
          console.warn('Failed to decrypt groqApiKey, assuming plaintext:', error.message);
          return value;
        }
      }
    },
    groqModel: {
      type: String,
      default: 'mixtral-8x7b-32768'
    },
    
    // Post-Processing Options
    processingOptions: {
      spelling: {
        type: Boolean,
        default: true
      },
      grammar: {
        type: Boolean,
        default: true
      },
      codeMix: {
        type: Boolean,
        default: false
      },
      codeMixLanguage: {
        type: String,
        default: 'Hinglish'
      },
      targetLanguage: {
        type: Boolean,
        default: false
      },
      targetLanguageValue: {
        type: String,
        default: 'en'
      }
    },
    
    // UI Preferences (unused fields kept for future use)
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },

    // Hotkey selection (mirrors macOS options as close as the browser allows)
    hotkey: {
      type: String,
      default: 'rightOption'
    },

    // Recording flow preferences
    micTestEnabled: {
      type: Boolean,
      default: true
    },
    preMuteDelayMs: {
      type: Number,
      default: 150
    },
    microphoneDeviceId: {
      type: String,
      default: ''
    },
    
    // Feature Toggles (web-only, not in desktop)
    autoCopy: {
      type: Boolean,
      default: false
    },
    
    // Cache
    availableDeepgramModels: {
      type: mongoose.Schema.Types.Mixed,
      default: []
    },
    availableGroqModels: {
      type: mongoose.Schema.Types.Mixed,
      default: []
    },
    lastModelsSync: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true }
  }
);

// Encrypt API keys before saving
settingsSchema.pre('save', function(next) {
  try {
    if (this.isModified('deepgramApiKey') && this.deepgramApiKey) {
      this.deepgramApiKey = encryptData(this.deepgramApiKey);
    }
    if (this.isModified('groqApiKey') && this.groqApiKey) {
      this.groqApiKey = encryptData(this.groqApiKey);
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Convert to JSON with API keys included
settingsSchema.methods.toJSON = function() {
  const obj = this.toObject({ getters: true });
  return obj;
};

// Index for faster queries
settingsSchema.index({ userId: 1 });

// NOTE: Don't use pre('find') middleware to exclude fields
// This prevents select() from working properly to include them
// Instead rely on select: false in the schema and explicit select() in queries

module.exports = mongoose.model('Settings', settingsSchema);
