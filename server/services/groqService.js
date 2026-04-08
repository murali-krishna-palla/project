const axios = require('axios');
const logger = require('../utils/logger');
const constants = require('../config/constants');

/**
 * Business Logic Layer - Service for Groq LLM Post-Processing
 */
class GroqService {
  async processText(text, options, apiKey, model) {
    try {
      const systemPrompt = this.buildPrompt(options);

      const response = await axios.post(
        `${constants.GROQ.API_URL}/chat/completions`,
        {
          model: model || constants.GROQ.DEFAULT_MODEL,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: `Please process this text:\n\n${text}`
            }
          ],
          temperature: constants.GROQ.TEMPERATURE,
          max_tokens: 1024
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content || text;
    } catch (err) {
      logger.error('Groq API error:', err.message);
      return text;
    }
  }

  async getBalance(apiKey) {
    try {
      logger.info('📊 Fetching Groq account info...');
      
      // Fetch models to verify API key and get available models
      const modelsResponse = await axios.get(
        `${constants.GROQ.API_URL}/models`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const models = modelsResponse.data.data || [];
      logger.info('✓ Retrieved Groq models list');
      
      // Try to get user account info (if endpoint exists)
      try {
        const userResponse = await axios.get(
          `${constants.GROQ.API_URL}/user`,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        const user = userResponse.data;
        return {
          status: 'success',
          username: user.name || user.username || 'User',
          email: user.email,
          modelsAvailable: models.length,
          models: models.slice(0, 5).map(m => ({ id: m.id, owner: m.owned_by })),
          apiValid: true
        };
      } catch (userErr) {
        // If user endpoint doesn't exist, just return model info
        logger.warn('Could not fetch user info, returning available models');
        return {
          status: 'success',
          modelsAvailable: models.length,
          models: models.slice(0, 5).map(m => ({ id: m.id, owner: m.owned_by })),
          message: 'API key verified - Groq Free tier has unlimited usage',
          apiValid: true
        };
      }
    } catch (err) {
      logger.error('❌ Failed to fetch Groq balance:', err.message);
      return {
        status: 'error',
        message: err.response?.status === 401 ? 'Invalid API key' : 'Failed to fetch account info',
        apiValid: false
      };
    }
  }

  buildPrompt(options) {
    let prompt = 'You are a precise text processing assistant. ';
    const steps = [];

    if (options.codeMix && options.codeMixLanguage) {
      const codeMixName = constants.CODE_MIX_LANGUAGES[options.codeMixLanguage];
      steps.push(`Convert to ${codeMixName}`);
    }

    if (options.spelling) {
      steps.push('Fix spelling errors');
    }

    if (options.grammar) {
      steps.push('Correct grammar and punctuation');
    }

    if (options.targetLanguage && options.targetLanguage !== 'en') {
      steps.push(`Translate to ${options.targetLanguage}`);
    }

    if (steps.length > 0) {
      prompt += 'Apply these transformations in order: ' + steps.join(', ') + '.';
    } else {
      prompt += 'Return the text as-is.';
    }

    return prompt;
  }

  async fetchModels(apiKey) {
    try {
      const response = await axios.get(
        `${constants.GROQ.API_URL}/models`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`
          }
        }
      );

      return response.data.data || [];
    } catch (err) {
      logger.error('Error fetching Groq models:', err.message);
      return [];
    }
  }
}

module.exports = GroqService;
