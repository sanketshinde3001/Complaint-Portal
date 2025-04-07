const express = require('express');
const activityController = require('../controllers/activityController');

const router = express.Router();

// Public route to get recent activity feed
router.get('/recent', activityController.getRecentActivity);

module.exports = router;
