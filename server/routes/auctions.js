const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const { verifyToken } = require('../middleware/auth');

// Place a bid on an auction item
router.post('/:id/bid', verifyToken, async (req, res) => {
  try {
    const { amount } = req.body;
    
    // Input validation
    if (!amount) {
      return res.status(400).json({ message: 'Bid amount is required' });
    }
    
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ message: 'Bid amount must be a positive number' });
    }
    
    if (amount > 1000000) {
      return res.status(400).json({ message: 'Bid amount cannot exceed $1,000,000' });
    }
    
    // Find and update item atomically to prevent race conditions
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    
    if (item.saleType !== 'auction') {
      return res.status(400).json({ message: 'Item is not an auction' });
    }
    
    if (item.isSold) {
      return res.status(400).json({ message: 'Item has already been sold' });
    }
    
    if (item.seller.toString() === req.userId) {
      return res.status(400).json({ message: 'You cannot bid on your own item' });
    }
    
    const now = new Date();
    if (item.auctionEnd && now > new Date(item.auctionEnd)) {
      return res.status(400).json({ message: 'Auction has ended' });
    }
    
    const minBid = item.currentPrice || item.startingPrice || 0;
    if (amount <= minBid) {
      return res.status(400).json({ 
        message: `Bid must be higher than current price of $${minBid.toFixed(2)}` 
      });
    }
    
    // Use atomic update to prevent race conditions
    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          bids: {
            bidder: req.userId,
            amount: amount,
            createdAt: new Date()
          }
        },
        $set: {
          currentPrice: amount
        }
      },
      {
        new: true,
        runValidators: true
      }
    ).populate('seller', 'name email').populate('bids.bidder', 'name');
    
    // Double-check that our bid was accepted (in case of race condition)
    const userBid = updatedItem.bids.find(bid => 
      bid.bidder.toString() === req.userId && Math.abs(bid.amount - amount) < 0.01
    );
    
    if (!userBid) {
      return res.status(409).json({ 
        message: 'Bid was not accepted due to a higher concurrent bid' 
      });
    }
    
    res.json({
      message: 'Bid placed successfully',
      currentPrice: updatedItem.currentPrice,
      bidCount: updatedItem.bids.length,
      yourBid: userBid
    });
    
  } catch (err) {
    console.error('Bid placement error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid bid data' });
    }
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
