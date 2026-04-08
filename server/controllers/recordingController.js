const RecordingService = require('../services/recordingService');
const logger = require('../utils/logger');

class RecordingController {
  static async getRecordings(req, res) {
    try {
      const { userId } = req.params;
      const { limit = 20, skip = 0 } = req.query;
      const recordings = await RecordingService.getRecordings(userId, skip, limit);
      res.json(recordings);
    } catch (err) {
      logger.error('Get recordings failed:', err);
      res.status(500).json({ error: 'Failed to fetch recordings' });
    }
  }

  static async saveRecording(req, res) {
    try {
      const { userId } = req.params;
      const recordingData = req.body;
      const recording = await RecordingService.saveRecording(userId, recordingData);
      res.json(recording);
    } catch (err) {
      logger.error('Save recording failed:', err);
      res.status(500).json({ error: 'Failed to save recording' });
    }
  }

  static async deleteRecording(req, res) {
    try {
      const { userId, recordingId } = req.params;
      await RecordingService.deleteRecording(userId, recordingId);
      res.json({ message: 'Recording deleted' });
    } catch (err) {
      logger.error('Delete recording failed:', err);
      res.status(500).json({ error: 'Failed to delete recording' });
    }
  }
}

module.exports = RecordingController;
