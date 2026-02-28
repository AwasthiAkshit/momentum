const express = require('express');
const router = express.Router();
const { getRescheduleSuggestions } = require('../controllers/smartController');
const { protect } = require('../middleware/authMiddleware');

router.post('/reschedule', protect, getRescheduleSuggestions);

module.exports = router;
