// controllers/claim.controller.js
// Handles claim creation, retrieval, and status updates

const Claim = require('../models/Claim');
const Item = require('../models/Item');
const mongoose = require('mongoose');

// ─── Create Claim ─────────────────────────────────────────────────────────────
// POST /api/claims (protected)
const createClaim = async (req, res) => {
  try {
    const { itemId, message } = req.body;

    if (!itemId) {
      return res.status(400).json({ message: 'Item ID is required.' });
    }

    if (!mongoose.isValidObjectId(itemId)) {
      return res.status(400).json({ message: 'Invalid item ID.' });
    }

    // Check item exists
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    if (item.type !== 'found' || item.status !== 'open') {
      return res.status(409).json({ message: 'Claims can only be submitted for open found items.' });
    }

    // Prevent claiming your own reported item
    if (item.reportedBy.toString() === req.user.id) {
      return res.status(400).json({ message: 'You cannot claim your own reported item.' });
    }

    // Prevent duplicate claims — same user on same item
    const existingClaim = await Claim.findOne({
      item: itemId,
      claimedBy: req.user.id,
    });

    if (existingClaim) {
      return res.status(409).json({ message: 'You have already submitted a claim for this item.' });
    }

    // Create the claim
    const claim = await Claim.create({
      item: itemId,
      claimedBy: req.user.id,
      message: message || '',
    });

    console.log(`📋 New claim created by ${req.user.email} on item ${itemId}`);

    const populated = await Claim.findById(claim._id)
      .populate('item', 'title type status')
      .populate('claimedBy', 'name email');

    res.status(201).json(populated);
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: 'You have already submitted a claim for this item.' });
    }
    console.error('❌ Create claim error:', error.message);
    res.status(500).json({ message: 'Failed to submit claim.' });
  }
};

// ─── Get My Claims ────────────────────────────────────────────────────────────
// GET /api/claims/my (protected)
const getMyClaims = async (req, res) => {
  try {
    // Fetch all claims by the currently logged-in user
    const claims = await Claim.find({ claimedBy: req.user.id })
      .populate('item', 'title type status category location date image')
      .sort({ createdAt: -1 });

    res.status(200).json(claims);
  } catch (error) {
    console.error('❌ Get my claims error:', error.message);
    res.status(500).json({ message: 'Failed to fetch your claims.' });
  }
};

// ─── Get Claims By Item ───────────────────────────────────────────────────────
// GET /api/claims/item/:itemId (protected — item owner or admin only)
// Used by Dashboard to show incoming claims on the owner's found items
const getClaimsByItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.itemId);

    if (!item) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    // Only the item owner or admin can see all claims on an item
    const isOwner = item.reportedBy.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view these claims.' });
    }

    const claims = await Claim.find({ item: req.params.itemId })
      .populate('claimedBy', 'name email')
      .populate('item', 'title type status image location')
      .sort({ createdAt: -1 });

    res.status(200).json(claims);
  } catch (error) {
    console.error('❌ Get claims by item error:', error.message);
    res.status(500).json({ message: 'Failed to fetch claims for this item.' });
  }
};

// ─── Update Claim Status ──────────────────────────────────────────────────────
// PUT /api/claims/:id (protected — item owner or admin only)
const updateClaimStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // Validate status value
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be "approved" or "rejected".' });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid claim ID.' });
    }

    // Find the claim and populate the item to check ownership
    const claim = await Claim.findById(req.params.id).populate('item');

    if (!claim) {
      return res.status(404).json({ message: 'Claim not found.' });
    }

    // Authorization: only the item reporter or admin can approve/reject
    const isItemOwner = claim.item.reportedBy.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isItemOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to update this claim.' });
    }

    if (claim.status !== 'pending') {
      return res.status(409).json({ message: 'Only pending claims can be reviewed.' });
    }

    // Approval is atomic: exactly one claim wins and all other pending claims close.
    if (status === 'approved') {
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          const claimedItem = await Item.findOneAndUpdate(
            { _id: claim.item._id, type: 'found', status: 'open' },
            { $set: { status: 'claimed' } },
            { new: true, session }
          );

          if (!claimedItem) {
            const error = new Error('This item is no longer available for claims.');
            error.statusCode = 409;
            throw error;
          }

          await Claim.updateOne({ _id: claim._id, status: 'pending' }, { $set: { status: 'approved' } }, { session });
          await Claim.updateMany(
            { item: claim.item._id, _id: { $ne: claim._id }, status: 'pending' },
            { $set: { status: 'rejected' } },
            { session }
          );
        });
      } finally {
        await session.endSession();
      }
      console.log(`✅ Claim approved: item "${claim.item.title}" marked as claimed`);
    } else {
      claim.status = 'rejected';
      await claim.save();
      console.log(`❌ Claim rejected for item: "${claim.item.title}"`);
    }

    const updated = await Claim.findById(claim._id)
      .populate('item', 'title type status')
      .populate('claimedBy', 'name email');

    res.status(200).json(updated);
  } catch (error) {
    console.error('❌ Update claim status error:', error.message);
    res.status(error.statusCode || 500).json({ message: error.statusCode ? error.message : 'Failed to update claim status.' });
  }
};

module.exports = { createClaim, getMyClaims, getClaimsByItem, updateClaimStatus };
