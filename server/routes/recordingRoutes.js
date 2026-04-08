const express = require('express');
const { body, validationResult, param } = require('express-validator');
const { verifyToken } = require('../middleware/auth');
const RecordingController = require('../controllers/recordingController');

const router = express.Router();

// All recording routes require authentication
router.use(verifyToken);

router.get(
  '/:userId',
  [
    param('userId').trim()
  ],
  RecordingController.getRecordings
);

router.post(
  '/:userId',
  [
    param('userId').trim(),
    body('originalTranscript').notEmpty().withMessage('Transcript is required'),
    body('deepgramModel').optional().trim(),
    body('deepgramLanguage').optional().trim(),
    body('groqModel').optional().trim(),
    body('processingOptions').optional().isObject(),
    body('duration').optional().isInt({ min: 0 }).toInt()
  ],
  RecordingController.saveRecording
);

router.delete(
  '/:userId/:recordingId',
  [
    param('userId').trim(),
    param('recordingId').trim()
  ],
  RecordingController.deleteRecording
);

module.exports = router;
