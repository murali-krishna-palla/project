const Settings = require('../models/Settings');
const DeepgramService = require('./deepgramService');
const GroqService = require('./groqService');

class SettingsService {
  static async getSettings(userId) {
    let settings = await Settings.findOne({ userId }).select('+deepgramApiKey +groqApiKey');
    if (!settings) {
      settings = new Settings({ userId });
      await settings.save();
    }
    return settings;
  }

  static async updateSettings(userId, updates) {
    let settings = await Settings.findOne({ userId }).select('+deepgramApiKey +groqApiKey');
    if (!settings) {
      settings = new Settings({ userId });
    }
    
    Object.assign(settings, updates);
    settings.updatedAt = new Date();
    await settings.save();
    
    // Explicitly select the API keys for the response
    return await Settings.findOne({ userId }).select('+deepgramApiKey +groqApiKey');
  }

  static async fetchDeepgramModels(apiKey) {
    const deepgramService = new DeepgramService();
    return await deepgramService.fetchModels(apiKey);
  }

  static async fetchGroqModels(apiKey) {
    const groqService = new GroqService();
    return await groqService.fetchModels(apiKey);
  }

  static async getDeepgramBalance(apiKey) {
    const deepgramService = new DeepgramService();
    return await deepgramService.getBalance(apiKey);
  }

  static async getGroqBalance(apiKey) {
    const groqService = new GroqService();
    return await groqService.getBalance(apiKey);
  }
}

module.exports = SettingsService;
