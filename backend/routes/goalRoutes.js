const express = require('express');
const router = express.Router();
const { getGoals, setGoal, updateGoal, deleteGoal } = require('../controllers/goalController');
const { protect } = require('../middleware/authMiddleware');
const { check } = require('express-validator');

router.route('/')
    .get(protect, getGoals)
    .post(protect, [
        check('title', 'Title is required').not().isEmpty(),
        check('deadline', 'Deadline is required').not().isEmpty()
    ], setGoal);

router.route('/:id')
    .put(protect, updateGoal)
    .delete(protect, deleteGoal);

module.exports = router;
