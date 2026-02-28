const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    createOrUpdateEntry,
    getTodayEntry,
    getHistory,
    getStats
} = require('../controllers/journalController');

router.use(protect);

router.route('/')
    .post(createOrUpdateEntry);

router.get('/today', getTodayEntry);
router.get('/history', getHistory);
router.get('/stats', getStats);

module.exports = router;
