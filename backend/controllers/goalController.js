const asyncHandler = require('express-async-handler');
const Goal = require('../models/goalModel');
const Task = require('../models/taskModel');
const DailyLog = require('../models/dailyLogModel'); // Added for calendar
const { validationResult } = require('express-validator');

// @desc    Get goals
// @route   GET /api/goals
// @access  Private
const getGoals = asyncHandler(async (req, res) => {
    const goals = await Goal.find({ user: req.user.id, isArchived: { $ne: true } });
    res.status(200).json(goals);
});

// @desc    Set goal
// @route   POST /api/goals
// @access  Private
const setGoal = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400);
        throw new Error(errors.array()[0].msg);
    }

    let { title, description, deadline, priority, type, durationDays, startDate } = req.body;

    // Logic for Habit Duration
    if (type === 'habit' && durationDays && startDate) {
        const start = new Date(startDate);
        const end = new Date(start);
        end.setDate(start.getDate() + parseInt(durationDays));
        deadline = end; // Auto-calculate deadline
    }

    const goal = await Goal.create({
        user: req.user.id,
        title,
        description,
        deadline,
        startDate,
        priority: priority || 'medium',
        type: type || 'project',
        durationDays: durationDays || 0,
    });

    res.status(200).json(goal);
});

// @desc    Update goal
// @route   PUT /api/goals/:id
// @access  Private
const updateGoal = asyncHandler(async (req, res) => {
    const goal = await Goal.findById(req.params.id);

    if (!goal) {
        res.status(404);
        throw new Error('Goal not found');
    }

    // Check for user
    if (!req.user) {
        res.status(401);
        throw new Error('User not found');
    }

    // Make sure the logged in user matches the goal user
    if (goal.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    // Recalculate deadline if duration changed for habits
    let updateData = req.body;
    if (goal.type === 'habit' && (req.body.durationDays || req.body.startDate)) {
        const start = new Date(req.body.startDate || goal.startDate);
        const duration = parseInt(req.body.durationDays || goal.durationDays || 0);
        const end = new Date(start);
        end.setDate(start.getDate() + duration);
        updateData.deadline = end;
    }

    const updatedGoal = await Goal.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
    });

    res.status(200).json(updatedGoal);
});

// @desc    Delete goal
// @route   DELETE /api/goals/:id
// @access  Private
const deleteGoal = asyncHandler(async (req, res) => {
    const goal = await Goal.findById(req.params.id);

    if (!goal) {
        res.status(404);
        throw new Error('Goal not found');
    }

    // Check for user
    if (!req.user) {
        res.status(401);
        throw new Error('User not found');
    }

    // Make sure the logged in user matches the goal user
    if (goal.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    // Archive tasks associated with the goal
    await Task.updateMany({ goalId: goal._id }, { isArchived: true });

    // Keep Logs for history
    // await DailyLog.deleteMany({ goalId: goal._id });

    goal.isArchived = true;
    await goal.save();

    res.status(200).json({ id: req.params.id });
});

// @desc    Get goal calendar
// @route   GET /api/goals/:id/calendar
// @access  Private
const getGoalCalendar = asyncHandler(async (req, res) => {
    const goal = await Goal.findById(req.params.id);

    if (!goal) {
        res.status(404);
        throw new Error('Goal not found');
    }

    if (goal.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    const logs = await DailyLog.find({ goalId: req.params.id }).sort({ date: 1 });
    res.status(200).json(logs);
});

module.exports = {
    getGoals,
    setGoal,
    updateGoal,
    deleteGoal,
    getGoalCalendar,
};
