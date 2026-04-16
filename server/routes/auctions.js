const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const { verifyToken } = require('../middleware/auth');

// Place a bid on an auction item
router.post('/:id/bid', verifyToken, async (req, res) => {
  try {
    const { amount } = req.body;
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (item.saleType !== 'auction') return res.status(400).json({ message: 'Item is not an auction' });
    if (item.auctionEnd && new Date() > new Date(item.auctionEnd)) return res.status(400).json({ message: 'Auction ended' });
    const min = item.currentPrice || item.startingPrice || 0;
    if (amount <= min) return res.status(400).json({ message: 'Bid must be higher than current price' });
    item.bids.push({ bidder: req.userId, amount });
    item.currentPrice = amount;
    await item.save();
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// List active auctions
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const auctions = await Item.find({ saleType: 'auction', $or: [ { auctionEnd: { $exists: false } }, { auctionEnd: { $gt: now } } ] }).populate('seller', 'name');
    res.json(auctions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
