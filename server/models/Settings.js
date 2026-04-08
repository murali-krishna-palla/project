const mongoose = require('mongoose');

/**
 * Data Access Layer - Settings Schema
 * Stores user API keys, preferences, and model selections
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
      select: false // Don't return by default for security
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
      select: false // Don't return by default for security
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
    
    // UI Preferences
    hotkey: {
      type: String,
      default: 'alt' // 'alt', 'ctrl', 'cmd', 'fn'
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    autoMute: {
      type: Boolean,
      default: true
    },
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
    timestamps: true
  }
);

// Index for faster queries
settingsSchema.index({ userId: 1 });

// Middleware to exclude sensitive data
settingsSchema.pre(/^find/, function() {
  this.select('-deepgramApiKey -groqApiKey');
});

module.exports = mongoose.model('Settings', settingsSchema);
