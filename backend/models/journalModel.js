const mongoose = require('mongoose');

const journalSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    date: {
        type: Date,
        required: true,
    },
    mood: {
        type: String,
        enum: ['great', 'good', 'neutral', 'low'],
        required: true,
    },
    reflectionText: {
        type: String,
        required: true,
    },
    relatedGoalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Goal',
        default: null,
    },
}, {
    timestamps: true,
});

// Ensure unique constraint on userId + date (ignoring time)
// However, in the controller we'll normalize date to midnight.
journalSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('JournalEntry', journalSchema);
