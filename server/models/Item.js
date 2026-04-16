const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  bidder: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  amount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

const itemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  images: [String],
  category: { type: String, required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  saleType: { type: String, enum: ['fixed', 'auction'], default: 'fixed' },
  price: Number,
  startingPrice: Number,
  currentPrice: Number,
  bids: [bidSchema],
  auctionEnd: Date,
  isSold: { type: Boolean, default: false },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'cancelled'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Item', itemSchema);
