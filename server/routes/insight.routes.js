const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { createInsight, getIncomingInsights } = require('../controllers/insight.controller');

const router = express.Router();

router.post('/', protect, createInsight);
router.get('/incoming', protect, getIncomingInsights);

module.exports = router;
