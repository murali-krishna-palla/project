const mongoose = require('mongoose');

/**
 * Data Access Layer - Recording Schema
 * Stores transcription history and processing results
 */
const recordingSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    
    // Audio Metadata
    duration: {
      type: Number, // milliseconds
      required: true
    },
    audioFormat: {
      type: String,
      default: 'PCM16'
    },
    sampleRate: {
      type: Number,
      default: 16000
    },
    
    // Transcription Data
    originalTranscript: {
      type: String,
      required: true
    },
    processedTranscript: {
      type: String,
      default: '' // After Groq processing
    },
    
    // Model & Language Info
    deepgramModel: {
      type: String,
      default: 'nova-2'
    },
    deepgramLanguage: {
      type: String,
      default: 'en'
    },
    groqModel: {
      type: String,
      default: ''
    },
    
    // Processing Details
    processingOptions: {
      spelling: Boolean,
      grammar: Boolean,
      codeMix: Boolean,
      codeMixLanguage: String,
      targetLanguage: Boolean,
      targetLanguageValue: String
    },
    processingTime: {
      type: Number, // milliseconds for Groq processing
      default: 0
    },
    
    // Confidence & Quality
    deepgramConfidence: {
      type: Number, // 0-1
      default: 0
    },
    isFinal: {
      type: Boolean,
      default: true
    },
    
    // Status
    status: {
      type: String,
      enum: ['pending', 'transcribing', 'processing', 'completed', 'failed'],
      default: 'completed'
    },
    error: {
      type: String,
      default: null
    },
    
    // Tags for organization
    tags: [
      {
        type: String
      }
    ],
    isFavorited: {
      type: Boolean,
      default: false
    },
    customNotes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Indexes for faster queries
recordingSchema.index({ userId: 1, createdAt: -1 });
recordingSchema.index({ userId: 1, isFavorited: 1 });
recordingSchema.index({ userId: 1, deepgramLanguage: 1 });

// Full-text search on transcripts
recordingSchema.index({
  originalTranscript: 'text',
  processedTranscript: 'text'
});

// TTL index - auto-delete recordings after 90 days (optional, comment out if not needed)
// recordingSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model('Recording', recordingSchema);
