const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Validate environment variables first
const { validateEnvironment } = require('./config/validateEnv');
validateEnvironment();

// Import database connection
const dbConnection = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request size limiting
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Import rate limiting
const { generalLimit, authLimit, bidLimit, createItemLimit } = require('./middleware/rateLimit');

// Apply general rate limiting
app.use(generalLimit);

// Import routes
const authRoutes = require('./routes/auth');
const auctionRoutes = require('./routes/auctions');
const checkoutRoutes = require('./routes/checkout');

// Basic API endpoint
app.get("/api", (req, res) => {
  res.json({ message: "Hello from Express backend!" });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "Server is running" });
});

// Apply routes with specific rate limits
app.use('/api/auth', authLimit, authRoutes);
app.use('/api/auctions', bidLimit, auctionRoutes);
app.use('/api/checkout', bidLimit, checkoutRoutes);

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  console.error("Stack:", err.stack);
  
  // Don't send error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(err.status || 500).json({
    error: isDevelopment ? err.message : "Internal server error",
    ...(isDevelopment && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('🔄 SIGTERM received, shutting down gracefully...');
  await dbConnection.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🔄 SIGINT received, shutting down gracefully...');
  await dbConnection.disconnect();
  process.exit(0);
});

// Start server with database connection
async function startServer() {
  try {
    await dbConnection.connect();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();

module.exports = app;
