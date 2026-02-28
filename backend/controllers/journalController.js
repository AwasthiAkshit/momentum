const asyncHandler = require('express-async-handler');
const JournalEntry = require('../models/journalModel');
const journalService = require('../services/journalService');

// @desc    Create or update daily journal entry
// @route   POST /api/journal
// @access  Private
const createOrUpdateEntry = asyncHandler(async (req, res) => {
    const { mood, reflectionText, relatedGoalId } = req.body;
    const userId = req.user.id;

    // Normalize date to midnight UTC for uniqueness
    const now = new Date();
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    let entry = await JournalEntry.findOne({ user: userId, date });

    if (entry) {
        entry.mood = mood;
        entry.reflectionText = reflectionText;
        entry.relatedGoalId = relatedGoalId || null;
        await entry.save();
    } else {
        entry = await JournalEntry.create({
            user: userId,
            date,
            mood,
            reflectionText,
            relatedGoalId: relatedGoalId || null
        });
    }

    res.status(200).json(entry);
});

// @desc    Get today's journal entry
// @route   GET /api/journal/today
// @access  Private
const getTodayEntry = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const now = new Date();
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const entry = await JournalEntry.findOne({ user: userId, date });
    res.status(200).json(entry || null);
});

// @desc    Get journal history
// @route   GET /api/journal/history
// @access  Private
const getHistory = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const entries = await JournalEntry.find({ user: userId }).sort({ date: -1 });
    res.status(200).json(entries);
});

// @desc    Get journal stats (mood trends)
// @route   GET /api/journal/stats
// @access  Private
const getStats = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const stats = await journalService.getMoodTrends(userId);
    res.status(200).json(stats);
});

module.exports = {
    createOrUpdateEntry,
    getTodayEntry,
    getHistory,
    getStats
};
