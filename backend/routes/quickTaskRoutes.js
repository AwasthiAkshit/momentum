const express = require('express');
const router = express.Router();
const { getQuickTasks, createQuickTask, updateQuickTask, deleteQuickTask } = require('../controllers/quickTaskController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getQuickTasks).post(protect, createQuickTask);
router.route('/:id').put(protect, updateQuickTask).delete(protect, deleteQuickTask);

module.exports = router;
