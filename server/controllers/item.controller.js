// controllers/item.controller.js
// Handles CRUD operations for lost and found items

const Item = require('../models/Item');
const Claim = require('../models/Claim');
const mongoose = require('mongoose');

const publicReporterFields = 'name';
const editableItemFields = ['title', 'description', 'category', 'location', 'date', 'image'];

// ─── Get All Items ────────────────────────────────────────────────────────────
// GET /api/items?search=&category=&type=&status=
const getAllItems = async (req, res) => {
  try {
    const { search, category, type, status } = req.query;

    // Build dynamic filter query
    const filter = {};

    // Search by title or description using case-insensitive regex
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by category
    if (category) filter.category = category;

    // Filter by type (lost/found)
    if (type) filter.type = type;

    // Filter by status
    if (status) filter.status = status;

    // Fetch items and populate reporter info
    const items = await Item.find(filter)
      .populate('reportedBy', publicReporterFields)
      .sort({ createdAt: -1 }); // Newest first

    res.status(200).json(items);
  } catch (error) {
    console.error('❌ Get all items error:', error.message);
    res.status(500).json({ message: 'Failed to fetch items.' });
  }
};

// ─── Get Item By ID ───────────────────────────────────────────────────────────
// GET /api/items/:id
const getItemById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid item ID.' });
    }

    const item = await Item.findById(req.params.id).populate('reportedBy', publicReporterFields);

    if (!item) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    res.status(200).json(item);
  } catch (error) {
    console.error('❌ Get item by ID error:', error.message);
    res.status(500).json({ message: 'Failed to fetch item.' });
  }
};

// ─── Create Item ──────────────────────────────────────────────────────────────
// POST /api/items (protected)
const createItem = async (req, res) => {
  try {
    const { title, description, category, type, location, date, image } = req.body;

    // Validate required fields
    if (!title || !type || !location) {
      return res.status(400).json({ message: 'Title, type, and location are required.' });
    }

    // Create item with reportedBy from JWT payload
    const item = await Item.create({
      title,
      description,
      category,
      type,
      location,
      date: date || Date.now(),
      image: image || null,
      reportedBy: req.user.id, // From auth middleware
    });

    console.log(`📦 New item created: "${item.title}" (${item.type}) by user ${req.user.email}`);

    // Return populated item
    const populated = await Item.findById(item._id).populate('reportedBy', publicReporterFields);

    res.status(201).json(populated);
  } catch (error) {
    console.error('❌ Create item error:', error.message);
    res.status(500).json({ message: 'Failed to create item.' });
  }
};

// ─── Update Item ──────────────────────────────────────────────────────────────
// PUT /api/items/:id (protected — owner or admin only)
const updateItem = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid item ID.' });
    }

    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    // Authorization: only the item owner or admin can update
    const isOwner = item.reportedBy.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to update this item.' });
    }

    // Never accept ownership or workflow fields from the client.
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([field]) => editableItemFields.includes(field))
    );

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No permitted item fields were provided.' });
    }

    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('reportedBy', publicReporterFields);

    console.log(`✏️ Item updated: "${updatedItem.title}" by ${req.user.email}`);

    res.status(200).json(updatedItem);
  } catch (error) {
    console.error('❌ Update item error:', error.message);
    res.status(500).json({ message: 'Failed to update item.' });
  }
};

// ─── Delete Item ──────────────────────────────────────────────────────────────
// DELETE /api/items/:id (protected — owner or admin only)
const deleteItem = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid item ID.' });
    }

    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    // Authorization: only the item owner or admin can delete
    const isOwner = item.reportedBy.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this item.' });
    }

    // Keep claims and the item consistent even if an operation fails.
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await Claim.deleteMany({ item: item._id }, { session });
        await Item.findByIdAndDelete(req.params.id, { session });
      });
    } finally {
      await session.endSession();
    }

    console.log(`🗑️ Item deleted: "${item.title}" by ${req.user.email}`);

    res.status(200).json({ message: 'Item deleted successfully.' });
  } catch (error) {
    console.error('❌ Delete item error:', error.message);
    res.status(500).json({ message: 'Failed to delete item.' });
  }
};

// ─── Update Item Status ───────────────────────────────────────────────────────
// PATCH /api/items/:id/status (protected — owner or admin only)
const updateItemStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = ['open', 'closed', 'claimed', 'matched'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Allowed values are: ${allowedStatuses.join(', ')}`,
      });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid item ID.' });
    }

    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    // Authorization: only the item owner or admin can update status
    const isOwner = item.reportedBy.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to change status for this item.' });
    }

    item.status = status;
    await item.save();

    const populated = await Item.findById(item._id).populate('reportedBy', publicReporterFields);

    console.log(`🔄 Item status updated to "${status}": "${item.title}" by ${req.user.email}`);

    res.status(200).json(populated);
  } catch (error) {
    console.error('❌ Update item status error:', error.message);
    res.status(500).json({ message: 'Failed to update item status.' });
  }
};

module.exports = { getAllItems, getItemById, createItem, updateItem, deleteItem, updateItemStatus };
