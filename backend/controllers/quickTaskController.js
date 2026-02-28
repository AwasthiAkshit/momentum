const asyncHandler = require('express-async-handler');
const QuickTask = require('../models/quickTaskModel');

// @desc    Get quick tasks
// @route   GET /api/quick-tasks
// @access  Private
const getQuickTasks = asyncHandler(async (req, res) => {
    const tasks = await QuickTask.find({ user: req.user.id, isArchived: { $ne: true } });
    res.status(200).json(tasks);
});

// @desc    Create quick task
// @route   POST /api/quick-tasks
// @access  Private
const createQuickTask = asyncHandler(async (req, res) => {
    const { title, dueDate, priority } = req.body;

    if (!title) {
        res.status(400);
        throw new Error('Please add a title');
    }

    const task = await QuickTask.create({
        user: req.user.id,
        title,
        dueDate,
        priority: priority || 'medium'
    });

    res.status(201).json(task);
});

// @desc    Update quick task
// @route   PUT /api/quick-tasks/:id
// @access  Private
const updateQuickTask = asyncHandler(async (req, res) => {
    const task = await QuickTask.findById(req.params.id);

    if (!task) {
        res.status(404);
        throw new Error('Task not found');
    }

    if (task.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    const updatedTask = await QuickTask.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
    });

    res.status(200).json(updatedTask);
});

// @desc    Delete quick task
// @route   DELETE /api/quick-tasks/:id
// @access  Private
const deleteQuickTask = asyncHandler(async (req, res) => {
    const task = await QuickTask.findById(req.params.id);

    if (!task) {
        res.status(404);
        throw new Error('Task not found');
    }

    if (task.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    task.isArchived = true;
    await task.save();

    res.status(200).json({ id: req.params.id });
});

module.exports = {
    getQuickTasks,
    createQuickTask,
    updateQuickTask,
    deleteQuickTask
};
