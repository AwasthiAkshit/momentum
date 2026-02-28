const express = require('express');
const router = express.Router();
const { getDashboardData, getCharts } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.get('/dashboard', protect, getDashboardData);
router.get('/charts', protect, getCharts);

module.exports = router;

