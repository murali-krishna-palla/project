const express = require('express');
const { body, validationResult } = require('express-validator');
const { verifyToken } = require('../middleware/auth');
const SettingsController = require('../controllers/settingsController');

const router = express.Router();

// All settings routes require authentication
router.use(verifyToken);

// IMPORTANT: Specific routes MUST come before generic routes!
// Otherwise GET /:userId will match /models/deepgram with userId='models'
router.post(
  '/models/deepgram',
  [body('apiKey').notEmpty().withMessage('API key is required')],
  SettingsController.fetchDeepgramModels
);

router.post(
  '/models/groq',
  [body('apiKey').notEmpty().withMessage('API key is required')],
  SettingsController.fetchGroqModels
);

router.post(
  '/balance/deepgram',
  [body('apiKey').notEmpty().withMessage('API key is required')],
  SettingsController.getDeepgramBalance
);

router.post(
  '/balance/groq',
  [body('apiKey').notEmpty().withMessage('API key is required')],
  SettingsController.getGroqBalance
);

router.get('/:userId', SettingsController.getSettings);

router.put(
  '/:userId',
  [
    body('deepgramApiKey').optional().trim(),
    body('groqApiKey').optional().trim(),
    body('deepgramModel').optional().trim(),
    body('deepgramLanguage').optional().trim(),
    body('groqModel').optional().trim(),
    body('processingOptions').optional().isObject(),
    body('theme').optional().isIn(['light', 'dark', 'auto'])
  ],
  SettingsController.updateSettings
);

module.exports = router;
