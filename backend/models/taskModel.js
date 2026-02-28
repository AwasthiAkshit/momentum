const mongoose = require('mongoose');

const taskSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    goalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Goal',
        required: false // Optional: Task doesn't *have* to belong to a goal
    },
    title: {
        type: String,
        required: [true, 'Please add a title'],
    },
    description: {
        type: String,
    },
    status: {
        type: String,
        enum: ['pending', 'completed'],
        default: 'pending',
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium',
    },
    frequency: {
        type: String,
        enum: ['once', 'daily', 'weekly', 'monthly', 'custom'],
        default: 'once',
    },
    estimatedTime: {
        type: Number, // in minutes
        default: 30,
    },
    actualTime: {
        type: Number, // in minutes
        default: 0,
    },
    dueDate: {
        type: Date,
    },
    completionHistory: [{
        date: {
            type: Date,
            required: true
        },
        status: {
            type: String, // 'completed' or 'pending' (though mostly completed logs)
            default: 'completed'
        }
    }],
    lastCompletedDate: {
        type: Date
    },
    isArchived: {
        type: Boolean,
        default: false,
    }
}, {
    timestamps: true,
});

module.exports = mongoose.model('Task', taskSchema);
