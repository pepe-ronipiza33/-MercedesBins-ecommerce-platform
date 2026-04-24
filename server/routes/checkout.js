const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const { verifyToken } = require('../middleware/auth');

const stripeKey = process.env.STRIPE_SECRET_KEY;
let stripe = null;
if (stripeKey) {
  try {
    stripe = require('stripe')(stripeKey);
  } catch (err) {
    console.error('Stripe initialization failed:', err.message);
  }
}
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

router.post('/create-session/:itemId', verifyToken, async (req, res) => {
  try {
    if (!stripe) return res.status(500).json({ message: 'Stripe is not configured' });

    const item = await Item.findById(req.params.itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (item.saleType !== 'fixed') return res.status(400).json({ message: 'Only fixed-price items can be purchased directly' });
    if (item.isSold) return res.status(400).json({ message: 'Item has already been purchased' });
    if (item.seller.toString() === req.userId) return res.status(400).json({ message: 'You cannot purchase your own item' });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: item.title,
              description: item.description || 'Marketplace purchase',
              metadata: {
                itemId: item._id.toString()
              }
            },
            unit_amount: Math.round(item.price * 100)
          },
          quantity: 1
        }
      ],
      metadata: {
        itemId: item._id.toString(),
        buyerId: req.userId.toString()
      },
      success_url: `${CLIENT_URL}/checkout-success?session_id={CHECKOUT_SESSION_ID}&itemId=${item._id}`,
      cancel_url: `${CLIENT_URL}/`
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/confirm', verifyToken, async (req, res) => {
  try {
    if (!stripe) return res.status(500).json({ message: 'Stripe is not configured' });
    
    const { sessionId, itemId } = req.body;
    
    // Input validation
    if (!sessionId || typeof sessionId !== 'string' || sessionId.trim().length === 0) {
      return res.status(400).json({ message: 'Valid sessionId is required' });
    }
    
    if (!itemId || typeof itemId !== 'string' || itemId.trim().length === 0) {
      return res.status(400).json({ message: 'Valid itemId is required' });
    }

    // Verify Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session) {
      return res.status(400).json({ message: 'Invalid payment session' });
    }
    
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ message: 'Payment not completed' });
    }
    
    if (session.metadata?.buyerId !== req.userId.toString()) {
      return res.status(403).json({ message: 'Invalid buyer - payment session does not match user' });
    }

    if (session.metadata?.itemId !== itemId) {
      return res.status(400).json({ message: 'Payment session does not match item ID' });
    }

    // Atomic update to prevent race conditions
    const updatedItem = await Item.findOneAndUpdate(
      { 
        _id: itemId,
        isSold: false,  // Only update if not already sold
        saleType: 'fixed'  // Only fixed price items
      },
      {
        $set: {
          isSold: true,
          buyer: req.userId,
          paymentStatus: 'paid'
        }
      },
      {
        new: true,
        runValidators: true
      }
    ).populate('seller', 'name email').populate('buyer', 'name email');

    if (!updatedItem) {
      // Check if item exists and why update failed
      const existingItem = await Item.findById(itemId);
      if (!existingItem) {
        return res.status(404).json({ message: 'Item not found' });
      } else if (existingItem.isSold) {
        return res.status(400).json({ message: 'Item has already been sold' });
      } else if (existingItem.saleType !== 'fixed') {
        return res.status(400).json({ message: 'Item is not available for direct purchase' });
      } else {
        return res.status(400).json({ message: 'Unable to complete purchase - item may have changed' });
      }
    }

    // Additional security check
    if (updatedItem.seller.toString() === req.userId) {
      return res.status(400).json({ message: 'You cannot purchase your own item' });
    }

    res.json({ 
      item: updatedItem,
      message: 'Payment confirmed. Purchase complete!',
      purchaseDate: new Date()
    });
    
  } catch (err) {
    console.error('Payment confirmation error:', err);
    
    // Handle specific Stripe errors
    if (err.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ message: 'Invalid payment session' });
    } else if (err.type === 'StripeAPIError') {
      return res.status(500).json({ message: 'Payment service error' });
    } else if (err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid item data' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
