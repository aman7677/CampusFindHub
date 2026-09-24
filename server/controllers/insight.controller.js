const mongoose = require('mongoose');
const Insight = require('../models/Insight');
const Item = require('../models/Item');

// POST /api/insights
const createInsight = async (req, res) => {
  try {
    const { itemId, location, seenAt, message } = req.body;

    if (!itemId || !location || !seenAt || !message) {
      return res.status(400).json({ message: 'Item, location, date, and message are required.' });
    }
    if (!mongoose.isValidObjectId(itemId)) {
      return res.status(400).json({ message: 'Invalid item ID.' });
    }

    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ message: 'Item not found.' });
    if (item.type !== 'lost' || item.status !== 'open') {
      return res.status(409).json({ message: 'Information can only be shared for open lost-item reports.' });
    }
    if (item.reportedBy.toString() === req.user.id) {
      return res.status(400).json({ message: 'You cannot submit an insight on your own report.' });
    }

    const insight = await Insight.create({
      item: itemId,
      sharedBy: req.user.id,
      location,
      seenAt,
      message,
    });
    const populated = await Insight.findById(insight._id)
      .populate('item', 'title type status')
      .populate('sharedBy', 'name');

    res.status(201).json(populated);
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: 'You have already shared information for this item.' });
    }
    console.error('Insight creation error:', error.message);
    res.status(500).json({ message: 'Failed to share information.' });
  }
};

// GET /api/insights/incoming
const getIncomingInsights = async (req, res) => {
  try {
    const lostItems = await Item.find({ reportedBy: req.user.id, type: 'lost' }).select('_id');
    const itemIds = lostItems.map((item) => item._id);
    const insights = await Insight.find({ item: { $in: itemIds } })
      .populate('item', 'title location status image')
      .populate('sharedBy', 'name email')
      .sort({ createdAt: -1 });
    res.status(200).json(insights);
  } catch (error) {
    console.error('Incoming insights error:', error.message);
    res.status(500).json({ message: 'Failed to fetch incoming information.' });
  }
};

module.exports = { createInsight, getIncomingInsights };
