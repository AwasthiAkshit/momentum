const mongoose = require('mongoose');

const dailyLogSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    goalId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Goal',
    },
    date: {
        type: Date,
        required: true,
    },
    totalTasks: {
        type: Number,
        default: 0,
    },
    completedTasks: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ['completed', 'partial', 'missed'], // Green, Yellow, Red
        default: 'missed',
    },
}, {
    timestamps: true,
});

// Compound index to ensure one log per goal per day
dailyLogSchema.index({ goalId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyLog', dailyLogSchema);
