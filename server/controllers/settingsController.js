const SettingsService = require('../services/settingsService');
const logger = require('../utils/logger');

class SettingsController {
  static async getSettings(req, res) {
    try {
      const { userId } = req.params;
      const settings = await SettingsService.getSettings(userId);
      res.json(settings);
    } catch (err) {
      logger.error('Get settings failed:', err);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  }

  static async updateSettings(req, res) {
    try {
      const { userId } = req.params;
      const updates = req.body;
      const settings = await SettingsService.updateSettings(userId, updates);
      res.json(settings);
    } catch (err) {
      logger.error('Update settings failed:', err);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  }

  static async fetchDeepgramModels(req, res) {
    try {
      const { apiKey } = req.body;
      const models = await SettingsService.fetchDeepgramModels(apiKey);
      res.json({ models });
    } catch (err) {
      logger.error('Fetch Deepgram models failed:', err);
      res.status(500).json({ error: 'Failed to fetch models' });
    }
  }

  static async fetchGroqModels(req, res) {
    try {
      const { apiKey } = req.body;
      const models = await SettingsService.fetchGroqModels(apiKey);
      res.json({ models });
    } catch (err) {
      logger.error('Fetch Groq models failed:', err);
      res.status(500).json({ error: 'Failed to fetch models' });
    }
  }

  static async getDeepgramBalance(req, res) {
    try {
      const { apiKey } = req.body;
      const balance = await SettingsService.getDeepgramBalance(apiKey);
      res.json(balance);
    } catch (err) {
      logger.error('Get Deepgram balance failed:', err);
      res.status(500).json({ status: 'error', message: 'Failed to fetch balance' });
    }
  }

  static async getGroqBalance(req, res) {
    try {
      const { apiKey } = req.body;
      const balance = await SettingsService.getGroqBalance(apiKey);
      res.json(balance);
    } catch (err) {
      logger.error('Get Groq balance failed:', err);
      res.status(500).json({ status: 'error', message: 'Failed to fetch balance' });
    }
  }
}

module.exports = SettingsController;
