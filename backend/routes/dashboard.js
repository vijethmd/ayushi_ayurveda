// routes/dashboard.js
const express = require('express');
const router = express.Router();
const { getDashboardStats, getAnalytics } = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');
router.get('/', authenticate, getDashboardStats);
router.get('/analytics', authenticate, getAnalytics);
module.exports = router;
