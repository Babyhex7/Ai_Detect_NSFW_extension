const express = require("express");
const { ActivityLog } = require("../models");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Get activity logs
router.get("/", authMiddleware, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      domain,
      startDate,
      endDate,
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = req.query;

    const userId = req.userId;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where conditions
    const where = { userId };

    if (type) {
      where.type = type;
    }

    if (domain) {
      where.domain = { [require("sequelize").Op.like]: `%${domain}%` };
    }

    if (startDate && endDate) {
      where.createdAt = {
        [require("sequelize").Op.between]: [
          new Date(startDate),
          new Date(endDate),
        ],
      };
    } else if (startDate) {
      where.createdAt = {
        [require("sequelize").Op.gte]: new Date(startDate),
      };
    } else if (endDate) {
      where.createdAt = {
        [require("sequelize").Op.lte]: new Date(endDate),
      };
    }

    // Get activities and total count
    const [activities, totalCount] = await Promise.all([
      ActivityLog.findAll({
        where,
        limit: parseInt(limit),
        offset,
        order: [[sortBy, sortOrder.toUpperCase()]],
        raw: true,
      }),
      ActivityLog.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      success: true,
      data: {
        activities,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: totalCount,
          itemsPerPage: parseInt(limit),
          hasNextPage: parseInt(page) < totalPages,
          hasPreviousPage: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get activities error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get activity logs",
    });
  }
});

// Get activity statistics
router.get("/stats", authMiddleware, async (req, res) => {
  try {
    const { period = "7d" } = req.query;
    const userId = req.userId;

    // Calculate date range
    const days = parseInt(period.replace("d", ""));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [
      totalActivities,
      activitiesByType,
      activitiesByDomain,
      timelineData,
    ] = await Promise.all([
      // Total activities in period
      ActivityLog.count({
        where: {
          userId,
          createdAt: { [require("sequelize").Op.gte]: startDate },
        },
      }),

      // Activities by type
      ActivityLog.findAll({
        where: {
          userId,
          createdAt: { [require("sequelize").Op.gte]: startDate },
        },
        attributes: [
          "type",
          [
            require("sequelize").fn("COUNT", require("sequelize").col("id")),
            "count",
          ],
        ],
        group: ["type"],
        raw: true,
      }),

      // Top domains
      ActivityLog.findAll({
        where: {
          userId,
          createdAt: { [require("sequelize").Op.gte]: startDate },
          domain: { [require("sequelize").Op.ne]: null },
        },
        attributes: [
          "domain",
          [
            require("sequelize").fn("COUNT", require("sequelize").col("id")),
            "count",
          ],
        ],
        group: ["domain"],
        order: [
          [
            require("sequelize").fn("COUNT", require("sequelize").col("id")),
            "DESC",
          ],
        ],
        limit: 10,
        raw: true,
      }),

      // Timeline data (daily activities)
      generateActivityTimeline(userId, startDate, new Date()),
    ]);

    // Format data
    const typeStats = {};
    activitiesByType.forEach((item) => {
      typeStats[item.type] = parseInt(item.count);
    });

    const domainStats = activitiesByDomain.map((item) => ({
      domain: item.domain,
      count: parseInt(item.count),
    }));

    res.json({
      success: true,
      data: {
        totalActivities,
        activitiesByType: typeStats,
        topDomains: domainStats,
        timeline: timelineData,
      },
    });
  } catch (error) {
    console.error("Activity stats error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get activity statistics",
    });
  }
});

// Clear activity logs
router.delete("/clear", authMiddleware, async (req, res) => {
  try {
    const { beforeDate, type } = req.body;
    const userId = req.userId;

    const where = { userId };

    if (beforeDate) {
      where.createdAt = {
        [require("sequelize").Op.lt]: new Date(beforeDate),
      };
    }

    if (type) {
      where.type = type;
    }

    const deletedCount = await ActivityLog.destroy({ where });

    res.json({
      success: true,
      data: {
        deletedCount,
      },
      message: `Cleared ${deletedCount} activity logs`,
    });
  } catch (error) {
    console.error("Clear activities error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to clear activity logs",
    });
  }
});

// Log new activity (internal endpoint for services)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { type, action, domain, pageUrl, metadata } = req.body;

    if (!type) {
      return res.status(400).json({
        success: false,
        error: "Activity type is required",
      });
    }

    const activity = await ActivityLog.create({
      userId: req.userId,
      type,
      action,
      domain,
      pageUrl,
      metadata,
    });

    res.status(201).json({
      success: true,
      data: activity,
      message: "Activity logged successfully",
    });
  } catch (error) {
    console.error("Log activity error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to log activity",
    });
  }
});

// Helper function to generate activity timeline
async function generateActivityTimeline(userId, startDate, endDate) {
  const timeline = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const dayStart = new Date(current);
    const dayEnd = new Date(current);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const [
      totalActivities,
      detectionActivities,
      navigationActivities,
      settingActivities,
    ] = await Promise.all([
      ActivityLog.count({
        where: {
          userId,
          createdAt: {
            [require("sequelize").Op.gte]: dayStart,
            [require("sequelize").Op.lt]: dayEnd,
          },
        },
      }),
      ActivityLog.count({
        where: {
          userId,
          type: "DETECTION",
          createdAt: {
            [require("sequelize").Op.gte]: dayStart,
            [require("sequelize").Op.lt]: dayEnd,
          },
        },
      }),
      ActivityLog.count({
        where: {
          userId,
          type: "NAVIGATION",
          createdAt: {
            [require("sequelize").Op.gte]: dayStart,
            [require("sequelize").Op.lt]: dayEnd,
          },
        },
      }),
      ActivityLog.count({
        where: {
          userId,
          type: "SETTINGS",
          createdAt: {
            [require("sequelize").Op.gte]: dayStart,
            [require("sequelize").Op.lt]: dayEnd,
          },
        },
      }),
    ]);

    timeline.push({
      date: current.toISOString().split("T")[0],
      total: totalActivities,
      detection: detectionActivities,
      navigation: navigationActivities,
      settings: settingActivities,
    });

    current.setDate(current.getDate() + 1);
  }

  return timeline;
}

module.exports = router;
