const { validationResult } = require('express-validator');
const RecordingService = require('../services/recordingService');
const logger = require('../utils/logger');

class RecordingController {
  static async getRecordings(req, res) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation error',
          details: errors.array()
        });
      }

      const { userId } = req.params;

      // Verify userId matches authenticated user
      if (userId !== req.userId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only access your own recordings'
        });
      }

      const limit = Math.min(parseInt(req.query.limit) || 20, 100);
      const skip = Math.max(parseInt(req.query.skip) || 0, 0);

      const recordings = await RecordingService.getRecordings(userId, skip, limit);

      res.json({
        message: 'Recordings fetched successfully',
        recordings: recordings.recordings,
        total: recordings.total,
        limit,
        skip
      });
    } catch (err) {
      logger.error('Get recordings failed:', err);
      res.status(500).json({ error: 'Failed to fetch recordings' });
    }
  }

  static async saveRecording(req, res) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation error',
          details: errors.array()
        });
      }

      const { userId } = req.params;

      // Verify userId matches authenticated user
      if (userId !== req.userId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only save recordings for yourself'
        });
      }

      const recordingData = req.body;
      const recording = await RecordingService.saveRecording(userId, recordingData);

      logger.info(`Recording saved for user: ${userId}`);

      res.status(201).json({
        message: 'Recording saved successfully',
        data: recording
      });
    } catch (err) {
      logger.error('Save recording failed:', err);
      res.status(500).json({
        error: 'Failed to save recording',
        message: err.message
      });
    }
  }

  static async deleteRecording(req, res) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation error',
          details: errors.array()
        });
      }

      const { userId, recordingId } = req.params;

      // Verify userId matches authenticated user
      if (userId !== req.userId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only delete your own recordings'
        });
      }

      await RecordingService.deleteRecording(userId, recordingId);

      logger.info(`Recording deleted for user: ${userId}, recordingId: ${recordingId}`);

      res.json({
        message: 'Recording deleted successfully'
      });
    } catch (err) {
      logger.error('Delete recording failed:', err);
      res.status(500).json({
        error: 'Failed to delete recording',
        message: err.message
      });
    }
  }
}

module.exports = RecordingController;
