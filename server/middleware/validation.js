const validateObjectId = (req, res, next, paramName = 'id') => {
  const id = req.params[paramName];
  
  if (!id) {
    return res.status(400).json({ message: `${paramName} is required` });
  }
  
  // Basic ObjectId validation (24-character hex string)
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    return res.status(400).json({ message: `Invalid ${paramName} format` });
  }
  
  next();
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return false;
  }
  
  // At least 8 characters, at least 1 letter and 1 number
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
  return passwordRegex.test(password);
};

const sanitizeString = (str, maxLength = 1000) => {
  if (typeof str !== 'string') {
    return '';
  }
  
  return str.trim().substring(0, maxLength);
};

const validateItemData = (req, res, next) => {
  const { title, description, category, saleType, price, startingPrice, auctionEnd } = req.body;
  
  // Title validation
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ message: 'Title is required and must be a string' });
  }
  
  const sanitizedTitle = sanitizeString(title, 100);
  if (sanitizedTitle.length < 3) {
    return res.status(400).json({ message: 'Title must be at least 3 characters long' });
  }
  
  // Description validation
  if (description && typeof description === 'string') {
    const sanitizedDescription = sanitizeString(description, 2000);
    req.body.description = sanitizedDescription;
  }
  
  // Category validation
  const validCategories = ['electronics', 'clothing', 'home', 'books', 'sports', 'toys', 'other'];
  if (!category || !validCategories.includes(category)) {
    return res.status(400).json({ 
      message: `Category is required and must be one of: ${validCategories.join(', ')}` 
    });
  }
  
  // Sale type validation
  const validSaleTypes = ['fixed', 'auction'];
  if (!saleType || !validSaleTypes.includes(saleType)) {
    return res.status(400).json({ 
      message: `Sale type is required and must be either 'fixed' or 'auction'` 
    });
  }
  
  // Price validation for fixed price items
  if (saleType === 'fixed') {
    if (!price || typeof price !== 'number' || price <= 0 || price > 1000000) {
      return res.status(400).json({ 
        message: 'Price is required for fixed price items and must be between $0.01 and $1,000,000' 
      });
    }
    req.body.startingPrice = undefined;
    req.body.auctionEnd = undefined;
  } else if (saleType === 'auction') {
    // Starting price validation for auction items
    if (!startingPrice || typeof startingPrice !== 'number' || startingPrice <= 0 || startingPrice > 1000000) {
      return res.status(400).json({ 
        message: 'Starting price is required for auction items and must be between $0.01 and $1,000,000' 
      });
    }
    
    // Auction end date validation
    if (!auctionEnd) {
      return res.status(400).json({ message: 'Auction end date is required for auction items' });
    }
    
    const auctionEndDate = new Date(auctionEnd);
    const now = new Date();
    const maxEndDate = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days from now
    
    if (auctionEndDate <= now) {
      return res.status(400).json({ message: 'Auction end date must be in the future' });
    }
    
    if (auctionEndDate > maxEndDate) {
      return res.status(400).json({ message: 'Auction cannot last more than 30 days' });
    }
    
    req.body.price = undefined;
  }
  
  // Sanitize title
  req.body.title = sanitizedTitle;
  
  next();
};

const validateBidAmount = (req, res, next) => {
  const { amount } = req.body;
  
  if (amount === undefined || amount === null) {
    return res.status(400).json({ message: 'Bid amount is required' });
  }
  
  if (typeof amount !== 'number') {
    return res.status(400).json({ message: 'Bid amount must be a number' });
  }
  
  if (amount <= 0) {
    return res.status(400).json({ message: 'Bid amount must be greater than 0' });
  }
  
  if (amount > 1000000) {
    return res.status(400).json({ message: 'Bid amount cannot exceed $1,000,000' });
  }
  
  // Check for reasonable precision (2 decimal places)
  if (!Number.isFinite(amount) || amount.toString().split('.')[1]?.length > 2) {
    return res.status(400).json({ message: 'Bid amount cannot have more than 2 decimal places' });
  }
  
  next();
};

module.exports = {
  validateObjectId,
  validateEmail,
  validatePassword,
  sanitizeString,
  validateItemData,
  validateBidAmount
};
