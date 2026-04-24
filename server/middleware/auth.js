const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  // Check if authorization header exists
  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization header required' });
  }
  
  // Check if header format is correct
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization header must be in format: Bearer <token>' });
  }
  
  const token = authHeader.split(' ')[1];
  
  // Check if token exists
  if (!token) {
    return res.status(401).json({ message: 'Token required' });
  }
  
  // Check if token is a valid string
  if (typeof token !== 'string' || token.trim().length === 0) {
    return res.status(401).json({ message: 'Invalid token format' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Validate decoded token has required fields
    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: 'Invalid token structure' });
    }
    
    req.userId = decoded.id;
    next();
  } catch (err) {
    // Handle different JWT errors specifically
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    } else if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    } else if (err.name === 'NotBeforeError') {
      return res.status(401).json({ message: 'Token not active' });
    } else {
      console.error('JWT verification error:', err);
      return res.status(401).json({ message: 'Token verification failed' });
    }
  }
};
