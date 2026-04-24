const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  bidder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { 
    type: Number, 
    required: true,
    min: [0.01, 'Bid amount must be greater than 0']
  },
  createdAt: { type: Date, default: Date.now }
});

const itemSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, 'Title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters long'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: { 
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  images: [{
    type: String,
    validate: {
      validator: function(v) {
        // Basic URL validation for image URLs
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: 'Each image must be a valid URL to an image file'
    }
  }],
  category: { 
    type: String, 
    required: [true, 'Category is required'],
    trim: true,
    enum: {
      values: ['electronics', 'clothing', 'home', 'books', 'sports', 'toys', 'other'],
      message: 'Category must be one of: electronics, clothing, home, books, sports, toys, other'
    }
  },
  seller: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'Seller is required'] 
  },
  saleType: { 
    type: String, 
    enum: {
      values: ['fixed', 'auction'], 
      message: 'Sale type must be either fixed or auction'
    }, 
    default: 'fixed' 
  },
  price: { 
    type: Number,
    min: [0.01, 'Price must be greater than 0'],
    validate: {
      validator: function(v) {
        // Price is required for fixed price items
        if (this.saleType === 'fixed') {
          return v && v > 0;
        }
        return true; // Optional for auction items
      },
      message: 'Price is required for fixed price items'
    }
  },
  startingPrice: { 
    type: Number,
    min: [0.01, 'Starting price must be greater than 0'],
    validate: {
      validator: function(v) {
        // Starting price is required for auction items
        if (this.saleType === 'auction') {
          return v && v > 0;
        }
        return true; // Optional for fixed price items
      },
      message: 'Starting price is required for auction items'
    }
  },
  currentPrice: { 
    type: Number,
    min: [0, 'Current price cannot be negative']
  },
  bids: [bidSchema],
  auctionEnd: { 
    type: Date,
    validate: {
      validator: function(v) {
        // Auction end date is required for auction items
        if (this.saleType === 'auction') {
          return v && v > new Date();
        }
        return true; // Not applicable for fixed price items
      },
      message: 'Auction end date must be in the future for auction items'
    }
  },
  isSold: { type: Boolean, default: false },
  buyer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    validate: {
      validator: function(v) {
        // If item is sold, buyer should be set
        if (this.isSold) {
          return v != null;
        }
        return true;
      },
      message: 'Buyer is required when item is marked as sold'
    }
  },
  paymentStatus: { 
    type: String, 
    enum: {
      values: ['pending', 'paid', 'cancelled'], 
      message: 'Payment status must be pending, paid, or cancelled'
    }, 
    default: 'pending' 
  },
  createdAt: { type: Date, default: Date.now }
});

// Add indexes for better query performance
itemSchema.index({ seller: 1 });
itemSchema.index({ category: 1 });
itemSchema.index({ saleType: 1 });
itemSchema.index({ isSold: 1 });
itemSchema.index({ auctionEnd: 1 });

// Pre-save validation to ensure business logic
itemSchema.pre('save', function(next) {
  // Ensure auction items have proper structure
  if (this.saleType === 'auction') {
    if (!this.startingPrice) {
      return next(new Error('Auction items must have a starting price'));
    }
    if (!this.auctionEnd) {
      return next(new Error('Auction items must have an auction end date'));
    }
    if (this.auctionEnd <= new Date()) {
      return next(new Error('Auction end date must be in the future'));
    }
    // Clear price for auction items (not used)
    this.price = undefined;
  } else {
    // Fixed price items
    if (!this.price) {
      return next(new Error('Fixed price items must have a price'));
    }
    // Clear auction-specific fields for fixed price items
    this.startingPrice = undefined;
    this.currentPrice = undefined;
    this.auctionEnd = undefined;
    this.bids = [];
  }
  
  next();
});

module.exports = mongoose.model('Item', itemSchema);
