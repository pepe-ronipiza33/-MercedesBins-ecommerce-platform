const rateLimitStore = new Map();

// Simple in-memory rate limiting (for production, use Redis)
const createRateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // max requests per window
    message = 'Too many requests, please try again later',
    keyGenerator = (req) => req.ip
  } = options;

  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();
    
    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }
    
    const record = rateLimitStore.get(key);
    
    if (now > record.resetTime) {
      // Reset the window
      record.count = 1;
      record.resetTime = now + windowMs;
      return next();
    }
    
    if (record.count >= max) {
      return res.status(429).json({
        error: message,
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      });
    }
    
    record.count++;
    next();
  };
};

// Cleanup old records periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes

module.exports = {
  createRateLimit,
  // Pre-configured rate limits
  authLimit: createRateLimit({ max: 5, windowMs: 15 * 60 * 1000, message: 'Too many authentication attempts' }),
  generalLimit: createRateLimit({ max: 100, windowMs: 15 * 60 * 1000 }),
  bidLimit: createRateLimit({ max: 10, windowMs: 15 * 60 * 1000, message: 'Too many bids, please slow down' }),
  createItemLimit: createRateLimit({ max: 3, windowMs: 60 * 60 * 1000, message: 'Too many items created, please try again later' })
};
