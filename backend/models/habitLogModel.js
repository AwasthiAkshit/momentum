const mongoose = require('mongoose');

const habitLogSchema = mongoose.Schema(
    {
        habitId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'HabitGoal',
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        date: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: ['completed', 'skipped', 'missed'],
            default: 'completed',
        },
        notes: {
            type: String,
        }
    },
    {
        timestamps: true,
    }
);

// Ensure one log per habit per day
habitLogSchema.index({ habitId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('HabitLog', habitLogSchema);
