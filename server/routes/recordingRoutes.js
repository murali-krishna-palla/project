const express = require('express');
const router = express.Router();
const RecordingController = require('../controllers/recordingController');

router.get('/:userId', RecordingController.getRecordings);
router.post('/:userId', RecordingController.saveRecording);
router.delete('/:userId/:recordingId', RecordingController.deleteRecording);

module.exports = router;
