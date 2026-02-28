const mongoose = require('mongoose');

const habitGoalSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        title: {
            type: String,
            required: [true, 'Please add a habit title'],
        },
        description: {
            type: String,
        },
        startDate: {
            type: Date,
            required: true,
            default: Date.now,
        },
        durationDays: {
            type: Number,
            required: true,
            default: 21,
        },
        frequency: {
            type: String,
            enum: ['daily', 'weekly'],
            default: 'daily',
        },
        streak: {
            type: Number,
            default: 0,
        },
        consistency: {
            type: Number,
            default: 0, // Percentage
        },
        isArchived: {
            type: Boolean,
            default: false,
        }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('HabitGoal', habitGoalSchema);
