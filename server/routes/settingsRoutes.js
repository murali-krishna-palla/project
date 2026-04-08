const express = require('express');
const router = express.Router();
const SettingsController = require('../controllers/settingsController');

router.get('/:userId', SettingsController.getSettings);
router.put('/:userId', SettingsController.updateSettings);
router.post('/models/deepgram', SettingsController.fetchDeepgramModels);
router.post('/models/groq', SettingsController.fetchGroqModels);
router.post('/balance/deepgram', SettingsController.getDeepgramBalance);
router.post('/balance/groq', SettingsController.getGroqBalance);

module.exports = router;
