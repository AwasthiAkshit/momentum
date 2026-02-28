const mongoose = require('mongoose');

const projectGoalSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        title: {
            type: String,
            required: [true, 'Please add a project title'],
        },
        description: {
            type: String,
        },
        deadline: {
            type: Date,
        },
        status: {
            type: String,
            enum: ['not_started', 'in_progress', 'completed', 'on_hold'],
            default: 'not_started',
        },
        progress: {
            type: Number,
            default: 0, // Calculated percentage
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

module.exports = mongoose.model('ProjectGoal', projectGoalSchema);
