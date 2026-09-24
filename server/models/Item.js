// models/Item.js
// Mongoose schema for lost and found items reported on campus

const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  // Short descriptive title of the item
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },

  // Detailed description to help identify the item
  description: {
    type: String,
    trim: true,
  },

  // Category for filtering and organization
  category: {
    type: String,
    enum: ['Electronics', 'Books', 'ID Card', 'Keys', 'Bag', 'Clothing', 'Other'],
    default: 'Other',
  },

  // Whether item was lost or found
  type: {
    type: String,
    enum: ['lost', 'found'],
    required: [true, 'Item type (lost/found) is required'],
  },

  // Campus location where item was lost or found
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
  },

  // Date when the item was lost or found
  date: {
    type: Date,
    default: Date.now,
  },

  // Current resolution status of the item report
  status: {
    type: String,
    enum: ['open', 'matched', 'claimed', 'closed'],
    default: 'open',
  },

  // Optional image URL for visual identification
  image: {
    type: String,
    default: null,
  },

  // Reference to the user who reported this item
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // Timestamp of when the report was created
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Item', itemSchema);
