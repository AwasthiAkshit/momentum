const JournalEntry = require('../models/journalModel');

/**
 * Get mood trends for a user
 * @param {string} userId 
 */
const getMoodTrends = async (userId) => {
    const entries = await JournalEntry.find({ user: userId }).sort({ date: -1 }).limit(30);

    const moodCounts = {
        great: 0,
        good: 0,
        neutral: 0,
        low: 0
    };

    entries.forEach(entry => {
        moodCounts[entry.mood]++;
    });

    return {
        moodCounts,
        recentEntries: entries.slice(0, 5)
    };
};

module.exports = {
    getMoodTrends
};
