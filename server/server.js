const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const auctionRoutes = require('./routes/auctions');
const checkoutRoutes = require('./routes/checkout');
const User = require('./models/User');
const Item = require('./models/Item');

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecommerce';
const PORT = process.env.PORT || 5000;

const seedInitialHostItems = async () => {
  try {
    const hostEmail = process.env.HOST_EMAIL || 'host@ecommerce.local';
    const hostPassword = process.env.HOST_PASSWORD || 'hostpass123';
    let host = await User.findOne({ email: hostEmail });
    if (!host) {
      host = await new User({ name: 'Marketplace Host', email: hostEmail, password: hostPassword }).save();
      console.log('Seeded host user:', hostEmail);
    }

    const existingItems = await Item.countDocuments();
    if (existingItems === 0) {
      await Item.create([
        {
          title: 'Solar-Punk Streetwear Jacket',
          description: 'A limited-run jacket that combines upcycled materials with neon cyber accents for the bold modern collector.',
          category: 'Fashion & Apparel',
          saleType: 'fixed',
          price: 129.99,
          currentPrice: 129.99,
          images: [],
          seller: host._id,
          paymentStatus: 'pending',
        },
        {
          title: 'Augmented Reality Skateboard Deck',
          description: 'Auction item: a custom deck with AR-enabled grip tape and one-of-a-kind artwork.',
          category: 'Sports & Fitness',
          saleType: 'auction',
          startingPrice: 60,
          currentPrice: 60,
          auctionEnd: new Date(Date.now() + 1000 * 60 * 60 * 24),
          images: [],
          seller: host._id,
          paymentStatus: 'pending',
        }
      ]);
      console.log('Seeded initial marketplace items.');
    }
  } catch (error) {
    console.error('Host seeding failed:', error);
  }
};

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    if (process.env.SEED_INITIAL_HOST_ITEMS === 'true') {
      await seedInitialHostItems();
    }
  })
  .catch(err => console.error('MongoDB connection error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/checkout', checkoutRoutes);

app.get('/', (req, res) => {
  res.json({ status: 'Marketplace backend is live' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
