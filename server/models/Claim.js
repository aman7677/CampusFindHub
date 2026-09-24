// models/Claim.js
// Mongoose schema for claims submitted on found items

const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
  // The found item being claimed
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: [true, 'Item reference is required'],
  },

  // The user making the claim
  claimedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Claimant user reference is required'],
  },

  // Optional message explaining why the user believes this is their item
  message: {
    type: String,
    trim: true,
  },

  // Approval status managed by item owner or admin
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },

  // Timestamp of when the claim was submitted
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Database-level duplicate protection; controller checks alone are race-prone.
claimSchema.index({ item: 1, claimedBy: 1 }, { unique: true });

module.exports = mongoose.model('Claim', claimSchema);
