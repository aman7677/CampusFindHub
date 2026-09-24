// Information supplied by a community member about a lost item.

const mongoose = require('mongoose');

const insightSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true,
  },
  sharedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  location: {
    type: String,
    required: [true, 'Where you saw or found the item is required.'],
    trim: true,
    maxlength: 200,
  },
  seenAt: {
    type: Date,
    required: true,
  },
  message: {
    type: String,
    required: [true, 'Please share a short description of what you know.'],
    trim: true,
    maxlength: 1000,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// One helpful update per person per item prevents accidental duplicate submissions.
insightSchema.index({ item: 1, sharedBy: 1 }, { unique: true });

module.exports = mongoose.model('Insight', insightSchema);
