const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

// Import routes
const authRoutes = require("./routes/auth");
const detectionRoutes = require("./routes/detection");
const analyticsRoutes = require("./routes/analytics");
const userRoutes = require("./models/User");
const settingsRoutes = require("./routes/settings");

// Import middleware
const errorHandler = require("./middleware/errorHandler");
const authMiddleware = require("./middleware/auth");
const corsMiddleware = require("./middleware/cors");

// Import services
const database = require("./services/database");
const queueService = require("./services/queue");

class Server {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  initializeMiddleware() {
    // Security middleware
    this.app.use(
      helmet({
        crossOriginEmbedderPolicy: false,
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'"],
          },
        },
      })
    );

    // CORS configuration
    this.app.use(corsMiddleware);

    // Rate limiting
    const limiter = rateLimit({
      windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutes
      max: process.env.RATE_LIMIT_MAX || 100, // limit each IP to 100 requests per windowMs
      message: {
        error: "Too many requests from this IP, please try again later.",
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use("/api/", limiter);

    // Compression
    this.app.use(compression());

    // Logging
    if (process.env.NODE_ENV !== "test") {
      this.app.use(morgan("combined"));
    }

    // Body parsing
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // Static files (if needed)
    this.app.use("/uploads", express.static("uploads"));
  }

  initializeRoutes() {
    // Health check
    this.app.get("/health", (req, res) => {
      res.json({
        status: "OK",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        version: require("../package.json").version,
      });
    });

    // API routes
    this.app.use("/api/auth", authRoutes);
    this.app.use("/api/detect", detectionRoutes);
    this.app.use("/api/analytics", authMiddleware, analyticsRoutes);
    this.app.use("/api/user", authMiddleware, userRoutes);
    this.app.use("/api/settings", authMiddleware, settingsRoutes);

    // Default route
    this.app.get("/", (req, res) => {
      res.json({
        message: "NSFW Detector API",
        version: require("../package.json").version,
        documentation: "/api/docs",
      });
    });

    // 404 handler
    this.app.use("*", (req, res) => {
      res.status(404).json({
        error: "Route not found",
        path: req.originalUrl,
      });
    });
  }

  initializeErrorHandling() {
    this.app.use(errorHandler);
  }

  async initializeDatabase() {
    try {
      await database.authenticate();
      console.log("✅ Database connection established successfully");

      if (process.env.NODE_ENV !== "production") {
        await database.sync({ alter: true });
        console.log("✅ Database models synchronized");
      }
    } catch (error) {
      console.error("❌ Unable to connect to the database:", error);
      process.exit(1);
    }
  }

  async initializeServices() {
    try {
      // Initialize queue service
      await queueService.init();
      console.log("✅ Queue service initialized");
    } catch (error) {
      console.error("❌ Failed to initialize services:", error);
      process.exit(1);
    }
  }

  async start() {
    try {
      // Initialize database
      await this.initializeDatabase();

      // Initialize services
      await this.initializeServices();

      // Start server
      this.server = this.app.listen(this.port, () => {
        console.log(`🚀 Server running on port ${this.port}`);
        console.log(`📊 Environment: ${process.env.NODE_ENV}`);
        console.log(`🔗 API URL: http://localhost:${this.port}`);
        console.log(`❤️  Health check: http://localhost:${this.port}/health`);
      });

      // Graceful shutdown
      this.setupGracefulShutdown();
    } catch (error) {
      console.error("❌ Failed to start server:", error);
      process.exit(1);
    }
  }

  setupGracefulShutdown() {
    const gracefulShutdown = async (signal) => {
      console.log(`\n🔄 Received ${signal}. Starting graceful shutdown...`);

      // Close server
      if (this.server) {
        this.server.close(async () => {
          console.log("✅ HTTP server closed");

          try {
            // Close database connection
            await database.close();
            console.log("✅ Database connection closed");

            // Close queue service
            await queueService.close();
            console.log("✅ Queue service closed");

            console.log("✅ Graceful shutdown completed");
            process.exit(0);
          } catch (error) {
            console.error("❌ Error during shutdown:", error);
            process.exit(1);
          }
        });
      }

      // Force exit after 30 seconds
      setTimeout(() => {
        console.error("❌ Forced shutdown after timeout");
        process.exit(1);
      }, 30000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    process.on("uncaughtException", (error) => {
      console.error("❌ Uncaught Exception:", error);
      gracefulShutdown("uncaughtException");
    });

    process.on("unhandledRejection", (reason, promise) => {
      console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
      gracefulShutdown("unhandledRejection");
    });
  }
}

// Create and start server
const server = new Server();

if (require.main === module) {
  server.start();
}

module.exports = server;
