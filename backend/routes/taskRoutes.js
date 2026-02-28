const express = require('express');
const router = express.Router();
const { getTasks, createTask, updateTask, deleteTask } = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const { check } = require('express-validator');

router.route('/')
    .get(protect, getTasks)
    .post(protect, [
        check('title', 'Title is required').not().isEmpty()
    ], createTask);

router.route('/:id')
    .put(protect, updateTask)
    .delete(protect, deleteTask);

module.exports = router;
