const express = require('express');
const router = express.Router();
const { getPatientTimeline, getNotifications, markNotificationRead } = require('../controllers/timelineController');
const { authenticate } = require('../middleware/auth');

// Timeline
router.get('/patient/:patientId', authenticate, getPatientTimeline);

// Notifications
router.get('/notifications', authenticate, getNotifications);
router.patch('/notifications/:id/read', authenticate, markNotificationRead);

module.exports = router;
