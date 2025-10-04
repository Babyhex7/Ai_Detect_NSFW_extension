const express = require("express");
const { Detection, ActivityLog } = require("../models");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Get dashboard statistics
router.get("/dashboard", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get detection counts
    const [
      totalDetections,
      todayDetections,
      weeklyDetections,
      monthlyDetections,
      riskDistribution,
      topDomains,
      recentActivity,
    ] = await Promise.all([
      // Total detections
      Detection.count({ where: { userId } }),

      // Today's detections
      Detection.count({
        where: {
          userId,
          createdAt: { [require("sequelize").Op.gte]: today },
        },
      }),

      // Weekly detections
      Detection.count({
        where: {
          userId,
          createdAt: { [require("sequelize").Op.gte]: weekAgo },
        },
      }),

      // Monthly detections
      Detection.count({
        where: {
          userId,
          createdAt: { [require("sequelize").Op.gte]: monthAgo },
        },
      }),

      // Risk level distribution
      Detection.findAll({
        where: { userId },
        attributes: [
          "riskLevel",
          [
            require("sequelize").fn("COUNT", require("sequelize").col("id")),
            "count",
          ],
        ],
        group: ["riskLevel"],
        raw: true,
      }),

      // Top domains
      Detection.findAll({
        where: { userId },
        attributes: [
          "domain",
          "riskLevel",
          [
            require("sequelize").fn("COUNT", require("sequelize").col("id")),
            "count",
          ],
        ],
        group: ["domain", "riskLevel"],
        order: [
          [
            require("sequelize").fn("COUNT", require("sequelize").col("id")),
            "DESC",
          ],
        ],
        limit: 10,
        raw: true,
      }),

      // Recent activity
      ActivityLog.findAll({
        where: { userId },
        order: [["createdAt", "DESC"]],
        limit: 10,
      }),
    ]);

    // Process risk distribution
    const riskStats = { low: 0, medium: 0, high: 0 };
    riskDistribution.forEach((item) => {
      riskStats[item.riskLevel.toLowerCase()] = parseInt(item.count);
    });

    // Process top domains
    const domainsMap = new Map();
    topDomains.forEach((item) => {
      if (!domainsMap.has(item.domain)) {
        domainsMap.set(item.domain, {
          domain: item.domain,
          count: 0,
          riskLevel: "LOW",
        });
      }
      const domainData = domainsMap.get(item.domain);
      domainData.count += parseInt(item.count);

      // Set highest risk level
      if (
        item.riskLevel === "HIGH" ||
        (item.riskLevel === "MEDIUM" && domainData.riskLevel === "LOW")
      ) {
        domainData.riskLevel = item.riskLevel;
      }
    });

    const topDomainsArray = Array.from(domainsMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        totalDetections,
        todayDetections,
        weeklyDetections,
        monthlyDetections,
        riskDistribution: riskStats,
        topDomains: topDomainsArray,
        recentActivity,
      },
    });
  } catch (error) {
    console.error("Dashboard analytics error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get dashboard analytics",
    });
  }
});

// Get detailed analytics
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { period = "7d" } = req.query;
    const userId = req.userId;

    // Calculate date range
    const days = parseInt(period.replace("d", ""));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get detection and activity stats
    const [detectionStats, activityStats, timeline] = await Promise.all([
      Detection.getStatsByUser(userId, period),
      ActivityLog.getActivityStats(userId, period),
      generateTimeline(userId, startDate, new Date()),
    ]);

    res.json({
      success: true,
      data: {
        detections: detectionStats,
        activities: activityStats,
        timeline,
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get analytics data",
    });
  }
});

// Generate timeline data
async function generateTimeline(userId, startDate, endDate) {
  const timeline = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const dayStart = new Date(current);
    const dayEnd = new Date(current);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const [detections, activities] = await Promise.all([
      Detection.count({
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
          createdAt: {
            [require("sequelize").Op.gte]: dayStart,
            [require("sequelize").Op.lt]: dayEnd,
          },
        },
      }),
    ]);

    timeline.push({
      date: current.toISOString().split("T")[0],
      detections,
      activities,
    });

    current.setDate(current.getDate() + 1);
  }

  return timeline;
}

// Export data
router.post("/export", authMiddleware, async (req, res) => {
  try {
    const { format = "json", dateRange, includeData } = req.body;
    const userId = req.userId;

    let where = { userId };

    if (dateRange && dateRange.start && dateRange.end) {
      where.createdAt = {
        [require("sequelize").Op.between]: [
          new Date(dateRange.start),
          new Date(dateRange.end),
        ],
      };
    }

    const data = {};

    if (includeData.detections) {
      data.detections = await Detection.findAll({ where });
    }

    if (includeData.activities) {
      data.activities = await ActivityLog.findAll({ where });
    }

    if (includeData.analytics) {
      data.analytics = await Detection.getStatsByUser(userId, "all");
    }

    // Format response based on requested format
    if (format === "csv") {
      // Convert to CSV format
      const csv = convertToCSV(data);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=nsfw-data.csv"
      );
      res.send(csv);
    } else if (format === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=nsfw-data.json"
      );
      res.json({
        success: true,
        data,
        exportedAt: new Date().toISOString(),
      });
    } else {
      res.status(400).json({
        success: false,
        error: "Unsupported export format",
      });
    }
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to export data",
    });
  }
});

// Helper function to convert data to CSV
function convertToCSV(data) {
  let csv = "";

  if (data.detections) {
    csv += "DETECTIONS\n";
    csv += "ID,Domain,URL,Risk Level,Confidence,Created At\n";
    data.detections.forEach((detection) => {
      csv += `${detection.id},${detection.domain},${detection.pageUrl},${detection.riskLevel},${detection.confidence},${detection.createdAt}\n`;
    });
    csv += "\n";
  }

  if (data.activities) {
    csv += "ACTIVITIES\n";
    csv += "ID,Type,Action,Domain,Created At\n";
    data.activities.forEach((activity) => {
      csv += `${activity.id},${activity.type},${activity.action || ""},${
        activity.domain || ""
      },${activity.createdAt}\n`;
    });
  }

  return csv;
}

module.exports = router;
