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
      deepgramApiKey,
      groqApiKey,
      processingOptions
    } = recordingData;

    let processedTranscript = originalTranscript;
    let processingApplied = {
      spelling: false,
      grammar: false,
      codeMix: false,
      translation: false
    };

    // Apply Groq post-processing if enabled
    if (processingOptions && groqApiKey) {
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
            processingOptions.selectedGroqModel
          );

          processingApplied = {
            spelling: processingOptions.spelling || false,
            grammar: processingOptions.grammar || false,
            codeMix: processingOptions.codeMix || false,
            translation: processingOptions.targetLanguage ? true : false
          };
        }
      } catch (err) {
        logger.error('Groq processing failed:', err);
        processedTranscript = originalTranscript;
      }
    }

    const recording = new Recording({
      userId,
      originalTranscript,
      processedTranscript,
      model,
      language,
      processingApplied,
      duration: recordingData.duration || 0
    });

    await recording.save();
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
