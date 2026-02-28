const express = require('express');
const router = express.Router();
const { getHabits, createHabit, logHabit, getHabitLogs, deleteHabit } = require('../controllers/habitController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getHabits).post(protect, createHabit);
router.route('/:id').delete(protect, deleteHabit);
router.route('/:id/log').post(protect, logHabit);
router.route('/:id/logs').get(protect, getHabitLogs);

module.exports = router;
