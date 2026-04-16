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
    if (!sessionId || !itemId) return res.status(400).json({ message: 'sessionId and itemId are required' });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') return res.status(400).json({ message: 'Payment not completed' });
    if (session.metadata?.buyerId !== req.userId) return res.status(403).json({ message: 'Invalid buyer' });

    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (item.isSold) return res.status(400).json({ message: 'Item already sold' });

    item.isSold = true;
    item.buyer = req.userId;
    item.paymentStatus = 'paid';
    await item.save();

    res.json({ item, message: 'Payment confirmed. Purchase complete!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
