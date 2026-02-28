const mongoose = require('mongoose');

const aiInsightSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        type: {
            type: String,
            required: true,
            enum: ['weekly_summary', 'habit_insights', 'burnout_risk', 'project_suggestions', 'adaptive_plan'],
        },
        dataHash: {
            type: String,
            required: true,
            default: 'legacy_no_hash'
        },
        content: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
            expires: 86400, // Optional: Automatically delete insights after 24 hours to keep them fresh
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('AIInsight', aiInsightSchema);
