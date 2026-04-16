const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const { verifyToken } = require('../middleware/auth');

router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, description, category, saleType, price, startingPrice, auctionEnd, images = [] } = req.body;
    if (!title || !category || !saleType) return res.status(400).json({ message: 'Title, category, and saleType are required' });
    if (!['fixed', 'auction'].includes(saleType)) return res.status(400).json({ message: 'saleType must be fixed or auction' });

    const itemData = {
      title,
      description,
      category,
      images,
      seller: req.userId,
      saleType,
      isSold: false,
      paymentStatus: 'pending'
    };

    if (saleType === 'fixed') {
      if (typeof price !== 'number' || price <= 0) return res.status(400).json({ message: 'Fixed price must be a positive number' });
      itemData.price = price;
      itemData.currentPrice = price;
    } else {
      if (typeof startingPrice !== 'number' || startingPrice <= 0) return res.status(400).json({ message: 'Starting price must be a positive number' });
      const endDate = new Date(auctionEnd);
      if (!auctionEnd || isNaN(endDate.getTime()) || endDate <= new Date()) return res.status(400).json({ message: 'Auction end date must be a future date' });
      itemData.startingPrice = startingPrice;
      itemData.currentPrice = startingPrice;
      itemData.auctionEnd = endDate;
    }

    const item = new Item(itemData);
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const items = await Item.find({
      isSold: false,
      $or: [
        { saleType: 'fixed' },
        { saleType: 'auction', $or: [{ auctionEnd: { $exists: false } }, { auctionEnd: { $gt: now } }] }
      ]
    })
      .populate('seller', 'name email')
      .populate('bids.bidder', 'name email');
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/mine', verifyToken, async (req, res) => {
  try {
    const items = await Item.find({ seller: req.userId })
      .populate('seller', 'name email')
      .populate('bids.bidder', 'name email');
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('seller', 'name email')
      .populate('bids.bidder', 'name email');
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
