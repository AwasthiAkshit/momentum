const express = require('express');
const router = express.Router();
const {
    getWeeklySummary,
    getHabitInsights,
    getBurnoutRisk,
    getProjectSuggestions,
    getAdaptivePlan,
    getAllInsights,
    generateTasks
} = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.get('/weekly-summary', protect, getWeeklySummary);
router.get('/habit-insights', protect, getHabitInsights);
router.get('/burnout-risk', protect, getBurnoutRisk);
router.get('/project-suggestions', protect, getProjectSuggestions);
router.get('/adaptive-plan', protect, getAdaptivePlan);
router.get('/all-insights', protect, getAllInsights);

router.post('/generate-tasks', protect, generateTasks);

module.exports = router;
