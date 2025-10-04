const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const morgan = require("morgan");

// Import middleware
const corsMiddleware = require("./middleware/cors");
const errorHandler = require("./middleware/errorHandler");

// Import routes
const authRoutes = require("./routes/auth");
const detectionRoutes = require("./routes/detection");
const analyticsRoutes = require("./routes/analytics");
const userRoutes = require("./routes/user");
const activityRoutes = require("./routes/activity");
const systemRoutes = require("./routes/system");

// Import services
const databaseService = require("./services/database");
const queueService = require("./services/queueService");

const app = express();

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "http://localhost:*", "https://localhost:*"],
      },
    },
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// API rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 API requests per windowMs
  message: {
    success: false,
    error: "Too many API requests, please try again later.",
  },
});

// Auth rate limiting (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 auth requests per windowMs
  message: {
    success: false,
    error: "Too many authentication attempts, please try again later.",
  },
});

// General middleware
app.use(limiter);
app.use(compression());
app.use(morgan("combined"));
app.use(corsMiddleware);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check endpoint (before other middleware)
app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// API routes with rate limiting
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/detection", apiLimiter, detectionRoutes);
app.use("/api/analytics", apiLimiter, analyticsRoutes);
app.use("/api/user", apiLimiter, userRoutes);
app.use("/api/activity", apiLimiter, activityRoutes);
app.use("/api/system", apiLimiter, systemRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "NSFW Detection API Server",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    documentation: "/api/system/info",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    path: req.originalUrl,
    method: req.method,
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize services
async function initializeServer() {
  try {
    console.log("Initializing NSFW Detection API Server...");

    // Initialize database
    console.log("Connecting to database...");
    await databaseService.initialize();
    console.log("Database connected successfully");

    // Initialize queue service
    console.log("Starting queue service...");
    await queueService.initialize();
    console.log("Queue service started");

    console.log("Server initialization completed");
  } catch (error) {
    console.error("Failed to initialize server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully...");

  try {
    await queueService.shutdown();
    await databaseService.close();
    console.log("Server shutdown completed");
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(1);
  }
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully...");

  try {
    await queueService.shutdown();
    await databaseService.close();
    console.log("Server shutdown completed");
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

module.exports = { app, initializeServer };
