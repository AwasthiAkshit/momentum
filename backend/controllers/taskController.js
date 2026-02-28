const asyncHandler = require('express-async-handler');
const Task = require('../models/taskModel');
const Goal = require('../models/goalModel');
const DailyLog = require('../models/dailyLogModel');
const { validationResult } = require('express-validator');

// Helper to update Daily Log and Goal Progress
const updateGoalProgressAndLog = async (goalId, dateStr = null) => {
    if (!goalId) return;

    try {
        const goal = await Goal.findById(goalId);
        if (!goal) return;

        // 1. Update Daily Log (Only for Habits)
        if (goal.type === 'habit') {
            const today = dateStr ? new Date(dateStr) : new Date();
            // Normalize to midnight UTC or local? Best to stick to YYYY-MM-DD string stored as Date at midnight
            const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

            const tasks = await Task.find({ goalId });

            // Filter tasks that SHOULD be done today
            // For now, assume all 'daily' tasks are expected every day.
            const dailyTasks = tasks.filter(t => t.frequency === 'daily');
            const totalExpected = dailyTasks.length;

            if (totalExpected > 0) {
                let completedCount = 0;

                dailyTasks.forEach(task => {
                    // Check history for this specific date
                    const isDone = task.completionHistory.some(history => {
                        const hDate = new Date(history.date);
                        return hDate.toDateString() === todayMidnight.toDateString() && history.status === 'completed';
                    });
                    if (isDone) completedCount++;
                });

                let status = 'missed';
                if (completedCount === totalExpected) status = 'completed'; // Green
                else if (completedCount >= totalExpected / 2) status = 'partial'; // Yellow

                // Update or Create Log
                await DailyLog.findOneAndUpdate(
                    { goalId, date: todayMidnight },
                    {
                        user: goal.user,
                        totalTasks: totalExpected,
                        completedTasks: completedCount,
                        status: status
                    },
                    { upsert: true, new: true }
                );
            }
        }

        // 2. Update Goal Progress
        if (goal.type === 'habit') {
            // Progress = Number of 'completed' (Green) logs / Duration in Days
            const successLogs = await DailyLog.countDocuments({
                goalId,
                status: 'completed'
            });

            // Duration
            const duration = goal.durationDays || 1; // Avoid 0 div
            const progress = Math.min(100, Math.round((successLogs / duration) * 100));

            await Goal.findByIdAndUpdate(goalId, { progressPercentage: progress });

        } else {
            // PROJECT LOGIC
            const tasks = await Task.find({ goalId });
            const total = tasks.length;
            let completed = 0;

            tasks.forEach(task => {
                // Determine if task is completed
                // For projects, usually just check status (since they are once-off or manual reset)
                // But let's check our recurring logic helper just in case
                if (isTaskCompletedForCurrentPeriod(task)) {
                    completed++;
                }
            });
            const progress = total === 0 ? 0 : Math.min(100, Math.round((completed / total) * 100));
            await Goal.findByIdAndUpdate(goalId, { progressPercentage: progress });
        }

    } catch (err) {
        console.error('Error updating goal progress/log:', err);
    }
};

// Helper: Check if task is "done" based on frequency and history
// (Used mainly for reading state, or Project logic)
const isTaskCompletedForCurrentPeriod = (task) => {
    if (!task.frequency || task.frequency === 'once') {
        return task.status === 'completed';
    }
    if (!task.lastCompletedDate) return false;

    const last = new Date(task.lastCompletedDate);
    const now = new Date();
    const lastDate = new Date(last.getFullYear(), last.getMonth(), last.getDate());
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (task.frequency === 'daily') {
        return lastDate.getTime() === todayDate.getTime();
    }
    // ... weekly/monthly logic if needed ...
    return false;
};


// @desc    Get tasks
// @route   GET /api/tasks
// @access  Private
const getTasks = asyncHandler(async (req, res) => {
    const tasks = await Task.find({ user: req.user.id, isArchived: { $ne: true } });

    // Transform tasks to show dynamic status
    const dynamicTasks = tasks.map(task => {
        const taskObj = task.toObject();
        if (task.frequency && task.frequency !== 'once') {
            taskObj.status = isTaskCompletedForCurrentPeriod(task) ? 'completed' : 'pending';
        }
        return taskObj;
    });

    res.status(200).json(dynamicTasks);
});

// @desc    Create task
// @route   POST /api/tasks
// @access  Private
const createTask = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400);
        throw new Error(errors.array()[0].msg);
    }

    const task = await Task.create({
        user: req.user.id,
        title: req.body.title,
        description: req.body.description,
        goalId: req.body.goalId,
        status: req.body.status,
        difficulty: req.body.difficulty,
        estimatedTime: req.body.estimatedTime,
        dueDate: req.body.dueDate,
        frequency: req.body.frequency || 'once',
    });

    if (req.body.goalId) {
        await updateGoalProgressAndLog(req.body.goalId);
    }

    res.status(200).json(task);
});

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id);

    if (!task) {
        res.status(404);
        throw new Error('Task not found');
    }

    if (!req.user || task.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    // Special handling for Status Toggle
    if (req.body.status) {
        const isCompletedWithWait = (req.body.status === 'completed');
        const today = new Date();

        if (isCompletedWithWait) {
            // Check duplicate
            let alreadyDoneToday = false;
            if (task.completionHistory && task.completionHistory.length > 0) {
                const last = task.completionHistory[task.completionHistory.length - 1];
                const lastDate = new Date(last.date);
                if (lastDate.toDateString() === today.toDateString()) {
                    alreadyDoneToday = true;
                }
            }

            if (!alreadyDoneToday) {
                task.completionHistory.push({
                    date: today,
                    status: 'completed'
                });
                task.lastCompletedDate = today;
            }
            task.status = 'completed';

        } else if (req.body.status === 'pending') {
            // Undo logic
            if (task.completionHistory.length > 0) {
                const last = task.completionHistory[task.completionHistory.length - 1];
                const lastDate = new Date(last.date);
                if (lastDate.toDateString() === today.toDateString()) {
                    task.completionHistory.pop();
                }
            }
            task.status = 'pending';
            if (task.completionHistory.length > 0) {
                const last = task.completionHistory[task.completionHistory.length - 1];
                task.lastCompletedDate = last.date;
            } else {
                task.lastCompletedDate = null;
            }
        }
    }

    // Apply other updates
    if (req.body.title) task.title = req.body.title;
    if (req.body.description) task.description = req.body.description;
    if (req.body.frequency) task.frequency = req.body.frequency;
    if (req.body.goalId) task.goalId = req.body.goalId;
    if (req.body.difficulty) task.difficulty = req.body.difficulty;
    if (req.body.estimatedTime) task.estimatedTime = req.body.estimatedTime;
    if (req.body.dueDate !== undefined) task.dueDate = req.body.dueDate;

    await task.save();

    if (task.goalId) {
        // Trigger logic update
        // We need to pass the "date" of action. For now, assume it's Today.
        // If user marks old task done, we might need more complex logic, but stick to Today for MVP.
        await updateGoalProgressAndLog(task.goalId);
    }

    const taskObj = task.toObject();
    if (task.frequency && task.frequency !== 'once') {
        taskObj.status = isTaskCompletedForCurrentPeriod(task) ? 'completed' : 'pending';
    }

    res.status(200).json(taskObj);
});

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id);

    if (!task) {
        res.status(404);
        throw new Error('Task not found');
    }

    if (!req.user || task.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    const goalId = task.goalId;

    task.isArchived = true;
    await task.save();

    if (goalId) {
        await updateGoalProgressAndLog(goalId);
    }

    res.status(200).json({ id: req.params.id });
});

module.exports = {
    getTasks,
    createTask,
    updateTask,
    deleteTask,
};
