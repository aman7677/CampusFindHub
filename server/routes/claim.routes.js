// routes/claim.routes.js
// Route definitions for item claims management

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  createClaim,
  getMyClaims,
  getClaimsByItem,
  updateClaimStatus,
} = require('../controllers/claim.controller');

// POST /api/claims      — Submit a new claim on a found item (requires auth)
router.post('/', protect, createClaim);

// GET  /api/claims/my           — Get all claims submitted by current user (requires auth)
// NOTE: This route MUST be defined before /:id to avoid "my" being treated as an ID
router.get('/my', protect, getMyClaims);

// GET  /api/claims/item/:itemId  — Get all claims ON a specific item (item owner or admin only)
// NOTE: Also defined before /:id to prevent routing conflict
router.get('/item/:itemId', protect, getClaimsByItem);

// PUT  /api/claims/:id  — Approve or reject a claim (requires auth — item owner or admin)
router.put('/:id', protect, updateClaimStatus);

module.exports = router;
