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
    // Match vocal's exact prompt construction from GroqService.swift
    const instructions = [];
    let stepNumber = 1;

    // Code-Mix (from vocal's implementation)
    if (options.codeMix && options.codeMixLanguage) {
      const mixType = options.codeMixLanguage;
      instructions.push(
        `${stepNumber}. The input is in ${mixType}. Transliterate any non-Roman script (such as Devanagari, Tamil, etc.) to Roman script. Keep English words as-is. Do not translate — preserve the original meaning in mixed form.`
      );
      stepNumber += 1;
    }

    // Spelling correction
    if (options.spelling) {
      instructions.push(
        `${stepNumber}. Fix any spelling mistakes. Do not change meaning or structure.`
      );
      stepNumber += 1;
    }

    // Grammar correction
    if (options.grammar) {
      instructions.push(
        `${stepNumber}. Fix any grammar mistakes. Do not change meaning or add content.`
      );
      stepNumber += 1;
    }

    // Target language / Translation
    if (options.targetLanguage && options.targetLanguage !== 'en' && options.targetLanguage !== 'English') {
      // Check if target is a code-mix language
      const codeMixStyles = {
        'Hinglish': true, 'Tanglish': true, 'Benglish': true, 'Kanglish': true,
        'Tenglish': true, 'Minglish': true, 'Punglish': true, 'Spanglish': true,
        'Franglais': true, 'Portuñol': true, 'Chinglish': true, 'Japlish': true,
        'Konglish': true, 'Arabizi': true, 'Sheng': true, 'Camfranglais': true
      };

      if (codeMixStyles[options.targetLanguage]) {
        // Code-mix target (from vocal's implementation)
        instructions.push(
          `${stepNumber}. Rewrite the text in ${options.targetLanguage} style: keep English words as-is, and transliterate any non-Roman script (such as Devanagari, Tamil, etc.) to Roman script. Do not translate — preserve the original meaning in mixed form.`
        );
      } else {
        // Pure language translation
        instructions.push(
          `${stepNumber}. Translate the entire text to ${options.targetLanguage}. Every word must be in ${options.targetLanguage}.`
        );
      }
    }

    // Build final prompt exactly like vocal
    if (instructions.length > 0) {
      return (
        'Process the following text by applying these steps in order:\n' +
        instructions.join('\n') +
        '\nReturn only the final processed text with no explanation.'
      );
    } else {
      return 'Return the text as-is with no changes.';
    }
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
