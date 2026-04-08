const { validationResult } = require('express-validator');
const SettingsService = require('../services/settingsService');
const logger = require('../utils/logger');

class SettingsController {
  static async getSettings(req, res) {
    try {
      const { userId } = req.params;

      // Verify userId matches authenticated user
      if (userId !== req.userId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only access your own settings'
        });
      }

      const settings = await SettingsService.getSettings(userId);

      if (!settings) {
        return res.status(404).json({
          error: 'Settings not found'
        });
      }

      res.json(settings);
    } catch (err) {
      logger.error('Get settings failed:', err);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  }

  static async updateSettings(req, res) {
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
          message: 'You can only modify your own settings'
        });
      }

      const updates = req.body;
      const settings = await SettingsService.updateSettings(userId, updates);

      logger.info(`Settings updated for user: ${userId}`);

      // Return settings directly (not nested)
      res.json(settings);
    } catch (err) {
      logger.error('Update settings failed:', err);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  }

  static async fetchDeepgramModels(req, res) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation error',
          details: errors.array()
        });
      }

      const { apiKey } = req.body;
      const models = await SettingsService.fetchDeepgramModels(apiKey);

      res.json({
        message: 'Models fetched successfully',
        models
      });
    } catch (err) {
      logger.error('Fetch Deepgram models failed:', err);
      res.status(500).json({
        error: 'Failed to fetch models',
        message: err.message
      });
    }
  }

  static async fetchGroqModels(req, res) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation error',
          details: errors.array()
        });
      }

      const { apiKey } = req.body;
      const models = await SettingsService.fetchGroqModels(apiKey);

      res.json({
        message: 'Models fetched successfully',
        models
      });
    } catch (err) {
      logger.error('Fetch Groq models failed:', err);
      res.status(500).json({
        error: 'Failed to fetch models',
        message: err.message
      });
    }
  }

  static async getDeepgramBalance(req, res) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation error',
          details: errors.array()
        });
      }

      const { apiKey } = req.body;
      const balance = await SettingsService.getDeepgramBalance(apiKey);

      // Return balance directly (it already has status field)
      res.json(balance);
    } catch (err) {
      logger.error('Get Deepgram balance failed:', err);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch balance',
        details: err.message
      });
    }
  }

  static async getGroqBalance(req, res) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation error',
          details: errors.array()
        });
      }

      const { apiKey } = req.body;
      const balance = await SettingsService.getGroqBalance(apiKey);

      // Return balance directly (it already has status field)
      res.json(balance);
    } catch (err) {
      logger.error('Get Groq balance failed:', err);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch balance',
        details: err.message
      });
    }
  }
}

module.exports = SettingsController;
