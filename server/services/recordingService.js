const Recording = require('../models/Recording');
const GroqService = require('./groqService');
const logger = require('../utils/logger');

class RecordingService {
  static async getRecordings(userId, skip = 0, limit = 20) {
    const recordings = await Recording
      .find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Recording.countDocuments({ userId });
    
    return {
      recordings,
      total,
      skip,
      limit
    };
  }

  static async saveRecording(userId, recordingData) {
    const {
      originalTranscript,
      model,
      language,
      deepgramModel,
      deepgramLanguage,
      groqModel,
      deepgramApiKey,
      groqApiKey,
      processingOptions,
      duration = 0
    } = recordingData;

    let processedTranscript = originalTranscript;
    let processingTime = 0;
    const startTime = Date.now();

    // Apply Groq post-processing if enabled and API key exists
    if (processingOptions && groqApiKey && Object.values(processingOptions).some(Boolean)) {
      try {
        if (
          processingOptions.spelling ||
          processingOptions.grammar ||
          processingOptions.codeMix ||
          processingOptions.targetLanguage
        ) {
          const groqService = new GroqService();
          processedTranscript = await groqService.processText(
            originalTranscript,
            processingOptions,
            groqApiKey,
            processingOptions.selectedGroqModel || groqModel
          );

          processingTime = Date.now() - startTime;
          logger.info(`✓ Groq processing completed in ${processingTime}ms`);
        }
      } catch (err) {
        logger.error('Groq processing error:', err.message);
        processedTranscript = originalTranscript;
      }
    }

    // Create recording with all metadata matching vocal
    const recording = new Recording({
      userId,
      originalTranscript,
      processedTranscript,
      duration: Math.round(duration),
      
      // Audio format (always 16kHz, mono, 16-bit PCM for vocal compatibility)
      audioFormat: 'PCM16',
      sampleRate: 16000,
      
      // Model & Language
      deepgramModel: deepgramModel || model || 'nova-2',
      deepgramLanguage: deepgramLanguage || language || 'en',
      groqModel: processingOptions && (processingOptions.spelling || processingOptions.grammar || processingOptions.codeMix || processingOptions.targetLanguage) ? (groqModel || 'mixtral-8x7b-32768') : '',
      
      // Complete processing options (matching vocal exactly)
      processingOptions: processingOptions || {
        spelling: false,
        grammar: false,
        codeMix: false,
        codeMixLanguage: 'Hinglish',
        targetLanguage: false,
        targetLanguageValue: 'en'
      },
      processingTime,
      
      // Status
      status: 'completed',
      isFinal: true
    });

    await recording.save();
    logger.info(`✓ Recording saved: ${recording._id}`);
    return recording;
  }

  static async deleteRecording(userId, recordingId) {
    const result = await Recording.findOneAndDelete({
      _id: recordingId,
      userId
    });

    if (!result) {
      throw new Error('Recording not found');
    }

    return result;
  }
}

module.exports = RecordingService;
