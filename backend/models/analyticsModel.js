const mongoose = require('mongoose');

const analyticsSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        unique: true, // One analytics document per user
    },
    completionRate: {
        type: Number, // percentage
        default: 0,
    },
    productivityScore: {
        type: Number,
        default: 0,
    },
    streakCount: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Analytics', analyticsSchema);
