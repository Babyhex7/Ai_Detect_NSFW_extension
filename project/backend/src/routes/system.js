const express = require("express");
const path = require("path");
const fs = require("fs").promises;
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    success: true,
    data: {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
    },
  });
});

// Get API information
router.get("/info", (req, res) => {
  res.json({
    success: true,
    data: {
      name: "NSFW Detection API",
      version: "1.0.0",
      description: "Backend API for NSFW content detection system",
      endpoints: {
        auth: {
          register: "POST /api/auth/register",
          login: "POST /api/auth/login",
          refresh: "POST /api/auth/refresh",
          logout: "POST /api/auth/logout",
        },
        detection: {
          analyze: "POST /api/detection/analyze",
          history: "GET /api/detection/history",
          stats: "GET /api/detection/stats",
        },
        user: {
          profile: "GET /api/user/profile",
          updateProfile: "PUT /api/user/profile",
          changePassword: "PUT /api/user/password",
          settings: "GET /api/user/settings",
          updateSettings: "PUT /api/user/settings",
        },
        analytics: {
          dashboard: "GET /api/analytics/dashboard",
          detailed: "GET /api/analytics",
          export: "POST /api/analytics/export",
        },
        activity: {
          logs: "GET /api/activity",
          stats: "GET /api/activity/stats",
          clear: "DELETE /api/activity/clear",
        },
      },
    },
  });
});

// Get system statistics (admin only)
router.get("/stats", authMiddleware, async (req, res) => {
  try {
    // This would typically require admin role check
    const { User, Detection, ActivityLog } = require("../models");

    const [
      totalUsers,
      totalDetections,
      totalActivities,
      recentUsers,
      systemMetrics,
    ] = await Promise.all([
      User.count(),
      Detection.count(),
      ActivityLog.count(),
      User.count({
        where: {
          createdAt: {
            [require("sequelize").Op.gte]: new Date(
              Date.now() - 24 * 60 * 60 * 1000
            ),
          },
        },
      }),
      getSystemMetrics(),
    ]);

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          recent24h: recentUsers,
        },
        detections: {
          total: totalDetections,
        },
        activities: {
          total: totalActivities,
        },
        system: systemMetrics,
      },
    });
  } catch (error) {
    console.error("System stats error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get system statistics",
    });
  }
});

// Get server logs (admin only)
router.get("/logs", authMiddleware, async (req, res) => {
  try {
    const { level = "info", lines = 100 } = req.query;

    // This would typically require admin role check
    const logPath = path.join(__dirname, "../../logs/app.log");

    try {
      const logContent = await fs.readFile(logPath, "utf8");
      const logLines = logContent
        .split("\n")
        .filter((line) => line.trim())
        .slice(-parseInt(lines));

      res.json({
        success: true,
        data: {
          logs: logLines,
          total: logLines.length,
          level,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (fileError) {
      res.json({
        success: true,
        data: {
          logs: ["No log file found"],
          total: 0,
          level,
          timestamp: new Date().toISOString(),
        },
      });
    }
  } catch (error) {
    console.error("Get logs error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get server logs",
    });
  }
});

// Clear cache endpoint
router.post("/cache/clear", authMiddleware, (req, res) => {
  try {
    // This would typically require admin role check

    // Clear any in-memory caches
    const queueService = require("../services/queueService");
    const cacheStats = queueService.clearCache();

    res.json({
      success: true,
      data: {
        cleared: true,
        cacheStats,
        timestamp: new Date().toISOString(),
      },
      message: "Cache cleared successfully",
    });
  } catch (error) {
    console.error("Clear cache error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to clear cache",
    });
  }
});

// Database cleanup endpoint
router.post("/cleanup", authMiddleware, async (req, res) => {
  try {
    // This would typically require admin role check
    const { daysOld = 30, dryRun = false } = req.body;

    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    const { ActivityLog, Detection } = require("../models");

    let deletedActivities = 0;
    let deletedDetections = 0;

    if (!dryRun) {
      // Delete old activity logs
      deletedActivities = await ActivityLog.destroy({
        where: {
          createdAt: {
            [require("sequelize").Op.lt]: cutoffDate,
          },
        },
      });

      // Delete old detections (optional - might want to keep these)
      if (req.body.includeDetections) {
        deletedDetections = await Detection.destroy({
          where: {
            createdAt: {
              [require("sequelize").Op.lt]: cutoffDate,
            },
          },
        });
      }
    } else {
      // Count what would be deleted
      deletedActivities = await ActivityLog.count({
        where: {
          createdAt: {
            [require("sequelize").Op.lt]: cutoffDate,
          },
        },
      });

      if (req.body.includeDetections) {
        deletedDetections = await Detection.count({
          where: {
            createdAt: {
              [require("sequelize").Op.lt]: cutoffDate,
            },
          },
        });
      }
    }

    res.json({
      success: true,
      data: {
        dryRun,
        daysOld,
        cutoffDate: cutoffDate.toISOString(),
        deletedActivities,
        deletedDetections,
        timestamp: new Date().toISOString(),
      },
      message: dryRun
        ? "Cleanup preview completed"
        : "Database cleanup completed",
    });
  } catch (error) {
    console.error("Database cleanup error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to cleanup database",
    });
  }
});

// Helper function to get system metrics
function getSystemMetrics() {
  const used = process.memoryUsage();
  const loadAvg = require("os").loadavg();
  const cpuCount = require("os").cpus().length;

  return {
    memory: {
      rss: Math.round((used.rss / 1024 / 1024) * 100) / 100,
      heapTotal: Math.round((used.heapTotal / 1024 / 1024) * 100) / 100,
      heapUsed: Math.round((used.heapUsed / 1024 / 1024) * 100) / 100,
      external: Math.round((used.external / 1024 / 1024) * 100) / 100,
    },
    cpu: {
      loadAverage: loadAvg,
      cores: cpuCount,
    },
    uptime: {
      process: process.uptime(),
      system: require("os").uptime(),
    },
    nodeVersion: process.version,
    platform: process.platform,
    architecture: process.arch,
  };
}

module.exports = router;
