#!/usr/bin/env node

/**
 * NSFW Detection API Server
 * Entry point for the backend server
 */

const { app, initializeServer } = require("./src/app");

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || "localhost";

async function startServer() {
  try {
    // Initialize services first
    await initializeServer();

    // Start HTTP server
    const server = app.listen(PORT, HOST, () => {
      console.log(`
🚀 NSFW Detection API Server is running!

📍 Server URL: http://${HOST}:${PORT}
🔗 Health Check: http://${HOST}:${PORT}/health
📚 API Info: http://${HOST}:${PORT}/api/system/info
🌐 Environment: ${process.env.NODE_ENV || "development"}

📊 Dashboard endpoints:
   • Auth: http://${HOST}:${PORT}/api/auth/*
   • Detection: http://${HOST}:${PORT}/api/detection/*
   • Analytics: http://${HOST}:${PORT}/api/analytics/*
   • User: http://${HOST}:${PORT}/api/user/*
   • Activity: http://${HOST}:${PORT}/api/activity/*
   • System: http://${HOST}:${PORT}/api/system/*

⚡ Ready to handle NSFW detection requests!
      `);
    });

    // Handle server errors
    server.on("error", (error) => {
      if (error.syscall !== "listen") {
        throw error;
      }

      const bind = typeof PORT === "string" ? "Pipe " + PORT : "Port " + PORT;

      switch (error.code) {
        case "EACCES":
          console.error(`${bind} requires elevated privileges`);
          process.exit(1);
          break;
        case "EADDRINUSE":
          console.error(`${bind} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n${signal} received, shutting down gracefully...`);

      server.close(() => {
        console.log("HTTP server closed");
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error("Forced shutdown after timeout");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Start the server
startServer();
