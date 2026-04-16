const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic API endpoint
app.get("/api", (req, res) => {
  res.json({ message: "Hello from Express backend!" });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "Server is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(500).json({ error: "Internal server error" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
