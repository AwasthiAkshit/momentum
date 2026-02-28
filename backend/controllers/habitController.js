const asyncHandler = require('express-async-handler');
const HabitGoal = require('../models/habitGoalModel');
const HabitLog = require('../models/habitLogModel');
const habitService = require('../services/habitService');

// @desc    Get habits
// @route   GET /api/habits
// @access  Private
const getHabits = asyncHandler(async (req, res) => {
    const habits = await HabitGoal.find({
        user: req.user.id,
        isArchived: { $ne: true }
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const habitsWithLogs = await Promise.all(habits.map(async (habit) => {
        const allLogs = await HabitLog.find({ habitId: habit._id });

        // Recalculate streak and consistency
        const currentStreak = habitService.calculateCurrentStreak(allLogs);
        const completedLogsCount = allLogs.filter(l => l.status === 'completed').length;
        const consistency = habitService.calculateConsistency(completedLogsCount, habit.durationDays, habit.createdAt);

        // Update if changed
        if (habit.streak !== currentStreak || habit.consistency !== consistency) {
            habit.streak = currentStreak;
            habit.consistency = consistency;
            await habit.save();
        }

        const recentLogs = allLogs.filter(log => log.date >= sevenDaysAgo);
        return { ...habit.toObject(), logs: recentLogs };
    }));

    res.status(200).json(habitsWithLogs);
});

// @desc    Create habit
// @route   POST /api/habits
// @access  Private
const createHabit = asyncHandler(async (req, res) => {
    const { title, description, durationDays, frequency } = req.body;

    if (!title) {
        res.status(400);
        throw new Error('Please add a title');
    }

    const habit = await HabitGoal.create({
        user: req.user.id,
        title,
        description,
        durationDays,
        frequency
    });

    res.status(201).json(habit);
});

// @desc    Log habit completion
// @route   POST /api/habits/:id/log
// @access  Private
const logHabit = asyncHandler(async (req, res) => {
    const habitId = req.params.id;
    const { date, status, notes } = req.body; // date is ISO string

    const habit = await HabitGoal.findById(habitId);
    if (!habit) {
        res.status(404);
        throw new Error('Habit not found');
    }

    if (habit.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    const logDate = new Date(date);
    logDate.setHours(0, 0, 0, 0); // Normalize to midnight

    // Check if log exists
    let log = await HabitLog.findOne({
        habitId,
        date: logDate
    });

    const wasAlreadyCompleted = log && log.status === 'completed';

    if (log) {
        // Optimization: If nothing changed, don't write to DB
        if (log.status === (status || log.status) && log.notes === (notes || log.notes)) {
            return res.status(200).json(log);
        }
        log.status = status || log.status;
        log.notes = notes || log.notes;
        await log.save();
    } else {
        log = await HabitLog.create({
            habitId,
            user: req.user.id,
            date: logDate,
            status: status || 'completed',
            notes
        });
    }

    // Recalculate Logic using Service
    const allLogs = await HabitLog.find({ habitId });
    habit.streak = habitService.calculateCurrentStreak(allLogs);
    const completedLogsCount = allLogs.filter(l => l.status === 'completed').length;
    habit.consistency = habitService.calculateConsistency(completedLogsCount, habit.durationDays, habit.createdAt);

    await habit.save();

    res.status(200).json(log);
});

// @desc    Get habit logs for a habit
// @route   GET /api/habits/:id/logs
// @access  Private
const getHabitLogs = asyncHandler(async (req, res) => {
    const logs = await HabitLog.find({ habitId: req.params.id }).sort({ date: -1 });
    res.status(200).json(logs);
});

// @desc    Delete habit
// @route   DELETE /api/habits/:id
// @access  Private
const deleteHabit = asyncHandler(async (req, res) => {
    const habit = await HabitGoal.findById(req.params.id);

    if (!habit) {
        res.status(404);
        throw new Error('Habit not found');
    }

    if (habit.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    if (habit.isArchived) {
        await HabitLog.deleteMany({ habitId: req.params.id });
        await HabitGoal.findByIdAndDelete(req.params.id);
    } else {
        habit.isArchived = true;
        await habit.save();
    }

    res.status(200).json({ id: req.params.id });
});

module.exports = {
    getHabits,
    createHabit,
    logHabit,
    getHabitLogs,
    deleteHabit
};
