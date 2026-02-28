const asyncHandler = require('express-async-handler');
const aiService = require('../services/aiService');
const Analytics = require('../models/analyticsModel');
const HabitLog = require('../models/habitLogModel');
const HabitGoal = require('../models/habitGoalModel');
const Goal = require('../models/goalModel');
const ProjectGoal = require('../models/projectGoalModel');
const Task = require('../models/taskModel');
const JournalEntry = require('../models/journalModel');
const habitService = require('../services/habitService');

// @desc    Get weekly summary (AI)
// @route   GET /api/ai/weekly-summary
// @access  Private
const getWeeklySummary = asyncHandler(async (req, res) => {
    const analytics = await Analytics.findOne({ user: req.user.id });

    if (!analytics) {
        return res.status(200).json({
            strengths: ["Getting Started"],
            weaknesses: ["No data collected yet"],
            summary: "Welcome to your AI study planner! Start tracking tasks to see your insights.",
            trend: 'stable',
            score: 0,
            streak: 0
        });
    }

    try {
        const [recentTasks, recentJournals, activeHabits] = await Promise.all([
            Task.find({ user: req.user.id }).sort({ updatedAt: -1 }).limit(10).select('title status'),
            JournalEntry.find({ user: req.user.id }).sort({ date: -1 }).limit(5).select('mood'),
            HabitGoal.find({ user: req.user.id, isArchived: false }).select('title')
        ]);

        const stats = {
            productivityScore: analytics.productivityScore,
            completionRate: analytics.completionRate,
            streak: analytics.streakCount,
            recentActivity: {
                tasks: recentTasks.map(t => ({ title: t.title, status: t.status })),
                journals: recentJournals.map(j => j.mood),
                habits: activeHabits.map(h => h.title)
            }
        };
        const aiSummary = await aiService.getWeeklySummary(req.user.id, stats);
        res.status(200).json({
            ...aiSummary,
            score: analytics.productivityScore,
            streak: analytics.streakCount
        });
    } catch (error) {
        console.warn('AI Weekly Summary failed in controller:', error.message);
        res.status(500).json({ message: 'Insights temporarily unavailable' });
    }
});

// @desc    Get habit insights (AI)
// @route   GET /api/ai/habit-insights
// @access  Private
const getHabitInsights = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const habits = await HabitGoal.find({ user: userId, isArchived: false });
    // Fetch all logs once to avoid nested queries
    const allHabitLogs = await HabitLog.find({ user: userId }).sort({ date: -1 });

    const updatedHabits = habits.map((h) => {
        const hLogs = allHabitLogs.filter(l => l.habitId.toString() === h._id.toString());
        const streak = habitService.calculateCurrentStreak(hLogs);
        const completedCount = hLogs.filter(l => l.status === 'completed').length;
        const consistency = habitService.calculateConsistency(completedCount, h.durationDays, h.createdAt);

        // Map to plain object for AI input - avoid unnecessary DB saves during GET
        return { title: h.title, consistency: consistency || 0, streak: streak || 0 };
    });

    const habitData = {
        habits: updatedHabits,
        recentLogs: allHabitLogs.slice(0, 30).map(l => ({ date: l.date, status: l.status }))
    };

    try {
        const aiInsights = await aiService.getHabitInsights(userId, habitData);
        res.status(200).json(aiInsights);
    } catch (error) {
        console.warn('AI Habit Insights failed in controller:', error.message);
        res.status(500).json({ message: 'Insights temporarily unavailable' });
    }
});

// @desc    Get Burnout Risk (AI)
// @route   GET /api/ai/burnout-risk
// @access  Private
const getBurnoutRisk = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const recentJournals = await JournalEntry.find({ user: userId }).sort({ date: -1 }).limit(10);
    const [recentTasks, analytics] = await Promise.all([
        Task.find({ user: userId }).sort({ updatedAt: -1 }).limit(10).select('status'),
        Analytics.findOne({ user: userId })
    ]);

    const activityData = {
        recentReflections: recentJournals.map(j => ({ mood: j.mood, date: j.date })),
        recentTaskTrends: recentTasks.map(t => t.status),
        productivityTrend: analytics ? analytics.productivityScore : 0
    };

    try {
        const riskData = await aiService.getBurnoutRisk(userId, activityData);
        res.status(200).json(riskData);
    } catch (error) {
        console.warn('AI Burnout Risk failed in controller:', error.message);
        res.status(500).json({ message: 'Insights temporarily unavailable' });
    }
});


// @desc    Get project/goal suggestions (AI)
// @route   GET /api/ai/project-suggestions
// @access  Private
const getProjectSuggestions = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // Fetch from BOTH unified Goal schema and legacy ProjectGoal schema to ensure zero data loss
    const unifiedGoals = await Goal.find({ user: userId, isArchived: { $ne: true } });
    const legacyProjects = await ProjectGoal.find({ user: userId, isArchived: { $ne: true } });
    const pendingTasks = await Task.find({ user: userId, status: 'pending' }).limit(20);

    const projectData = {
        projects: [
            ...unifiedGoals.map(p => ({ title: p.title, progress: p.progressPercentage || 0, deadline: p.deadline })),
            ...legacyProjects.map(p => ({ title: p.title, progress: p.progress || 0, deadline: p.deadline }))
        ],
        pendingTasks: pendingTasks.map(t => t.title),
        pendingTasksCount: pendingTasks.length
    };

    try {
        const suggestions = await aiService.getProjectSuggestions(userId, projectData);
        res.status(200).json(suggestions);
    } catch (error) {
        console.warn('AI Project Suggestions failed:', error.message);
        res.status(500).json({ message: 'Insights temporarily unavailable' });
    }
});

// @desc    Get Adaptive Plan (AI)
// @route   GET /api/ai/adaptive-plan
// @access  Private
const getAdaptivePlan = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const pendingTasks = await Task.find({ user: userId, status: 'pending' });
    const analytics = await Analytics.findOne({ user: userId });

    const workloadData = {
        pendingTasksCount: pendingTasks.length,
        pendingTaskTitles: pendingTasks.map(t => t.title),
        productivityScore: analytics ? analytics.productivityScore : 0
    };

    try {
        const plan = await aiService.getAdaptivePlan(userId, workloadData);
        res.status(200).json(plan);
    } catch (error) {
        console.warn('AI Adaptive Plan failed:', error.message);
        res.status(500).json({ message: 'Insights temporarily unavailable' });
    }
});


// @desc    Generate tasks for a topic (Real AI)
// @route   POST /api/ai/generate-tasks
// @access  Private
const generateTasks = asyncHandler(async (req, res) => {
    const { topic } = req.body;
    if (!topic) {
        return res.status(400).json({ message: 'Topic is required' });
    }

    try {
        const aiTasks = await aiService.generateStudyTasks(topic);
        res.status(200).json({ tasks: aiTasks.tasks });
    } catch (error) {
        console.warn('AI Task Generation failed in controller:', error.message);
        res.status(500).json({ message: 'Insights temporarily unavailable' });
    }
});

// @desc    Get all insights (Consolidated AI)
// @route   GET /api/ai/all-insights
// @access  Private
const getAllInsights = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // 1. Gather ALL data in parallel
    const [
        analytics,
        habits,
        allHabitLogs,
        recentJournals,
        unifiedGoals,
        legacyProjects,
        pendingTasks
    ] = await Promise.all([
        Analytics.findOne({ user: userId }),
        HabitGoal.find({ user: userId, isArchived: false }),
        HabitLog.find({ user: userId }).sort({ date: -1 }),
        JournalEntry.find({ user: userId }).sort({ date: -1 }).limit(10),
        Goal.find({ user: userId, isArchived: { $ne: true } }),
        ProjectGoal.find({ user: userId, isArchived: { $ne: true } }),
        Task.find({ user: userId, status: 'pending' })
    ]);

    // 2. Process Habit Data
    const updatedHabits = habits.map((h) => {
        const hLogs = allHabitLogs.filter(l => l.habitId.toString() === h._id.toString());
        const streak = habitService.calculateCurrentStreak(hLogs);
        const completedCount = hLogs.filter(l => l.status === 'completed').length;
        const consistency = habitService.calculateConsistency(completedCount, h.durationDays, h.createdAt);
        return { title: h.title, consistency: consistency || 0, streak: streak || 0 };
    });

    // 3. Construct Aggregate Payload
    const studyData = {
        analytics: {
            productivityScore: analytics?.productivityScore || 0,
            completionRate: analytics?.completionRate || 0,
            streak: analytics?.streakCount || 0
        },
        habits: {
            habits: updatedHabits,
            recentLogsCount: allHabitLogs.length
        },
        workload: {
            pendingTasksCount: pendingTasks.length,
            pendingTaskTitles: pendingTasks.map(t => t.title).slice(0, 15),
            projects: [
                ...unifiedGoals.map(p => ({ title: p.title, progress: p.progressPercentage || 0, deadline: p.deadline })),
                ...legacyProjects.map(p => ({ title: p.title, progress: p.progress || 0, deadline: p.deadline }))
            ]
        },
        reflections: recentJournals.map(j => ({ mood: j.mood, date: j.date }))
    };

    try {
        const masterInsights = await aiService.getMasterInsight(userId, studyData);
        
        if (masterInsights && masterInsights.weeklySummary) {
            masterInsights.weeklySummary.score = studyData.analytics.productivityScore || 0;
            masterInsights.weeklySummary.streak = studyData.analytics.streak || 0;
        }

        res.status(200).json(masterInsights);
    } catch (error) {
        console.warn('Consolidated AI Insights failed:', error.message);
        res.status(500).json({ message: 'Insights temporarily unavailable' });
    }
});

module.exports = {
    getWeeklySummary,
    getHabitInsights,
    getBurnoutRisk,
    getProjectSuggestions,
    getAdaptivePlan,
    getAllInsights,
    generateTasks
};
