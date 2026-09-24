// routes/item.routes.js
// Route definitions for lost and found item management

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  updateItemStatus,
} = require('../controllers/item.controller');

// GET  /api/items       — List all items (with optional query filters)
router.get('/', getAllItems);

// POST /api/items       — Create new item report (requires auth)
router.post('/', protect, createItem);

// GET  /api/items/:id   — Get single item by ID
router.get('/:id', getItemById);

// PUT  /api/items/:id   — Update item (requires auth — owner or admin)
router.put('/:id', protect, updateItem);

// PATCH /api/items/:id/status — Update item status (requires auth — owner or admin)
router.patch('/:id/status', protect, updateItemStatus);

// DELETE /api/items/:id — Delete item (requires auth — owner or admin)
router.delete('/:id', protect, deleteItem);

module.exports = router;
