const { smartReschedule } = require('../services/smartReschedulingService');

// @desc    Get AI reschedule suggestions
// @route   POST /api/smart/reschedule
// @access  Private
const getRescheduleSuggestions = async (req, res) => {
    try {
        // In a real app, userId would come from req.user
        // For now, assume req.user is populated by authMiddleware
        const result = await smartReschedule(req.user._id);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getRescheduleSuggestions
};
