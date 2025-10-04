import { Detection } from "../models/index.js";
import {
  successResponse,
  errorResponse,
  paginatedResponse,
} from "../utils/response.js";
import { validationResult } from "express-validator";
import { Op } from "sequelize";
import logger from "../config/logger.js";

export const analyzeElement = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, "Validation failed", 400, errors.array());
    }

    const { domain, url, elementType, fileSize, metadata } = req.body;
    const userId = req.user.id;

    // Simulate AI detection (replace with actual AI service call)
    const mockDetection = simulateAIDetection();

    // Save detection result
    const detection = await Detection.create({
      user_id: userId,
      domain,
      url,
      element_type: elementType,
      file_size: fileSize,
      detection_level: mockDetection.level,
      confidence_score: mockDetection.confidence,
      metadata,
    });

    logger.info(
      `Detection created for user ${userId}: ${mockDetection.level} level`
    );

    return successResponse(
      res,
      {
        detection: {
          id: detection.id,
          level: detection.detection_level,
          confidence: detection.confidence_score,
          timestamp: detection.created_at,
        },
      },
      "Element analyzed successfully"
    );
  } catch (error) {
    logger.error("Analyze element error:", error);
    return errorResponse(res, "Analysis failed", 500);
  }
};

export const logAction = async (req, res) => {
  try {
    const { detectionId, action } = req.body;
    const userId = req.user.id;

    // Find and update detection
    const detection = await Detection.findOne({
      where: {
        id: detectionId,
        user_id: userId,
      },
    });

    if (!detection) {
      return errorResponse(res, "Detection not found", 404);
    }

    await detection.update({ action_taken: action });

    logger.info(`Action logged for detection ${detectionId}: ${action}`);

    return successResponse(res, null, "Action logged successfully");
  } catch (error) {
    logger.error("Log action error:", error);
    return errorResponse(res, "Failed to log action", 500);
  }
};

export const getDetections = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      page = 1,
      limit = 20,
      level,
      domain,
      startDate,
      endDate,
    } = req.query;

    const offset = (page - 1) * limit;
    const where = { user_id: userId };

    // Add filters
    if (level) {
      where.detection_level = level;
    }

    if (domain) {
      where.domain = { [Op.like]: `%${domain}%` };
    }

    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) {
        where.created_at[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.created_at[Op.lte] = new Date(endDate);
      }
    }

    const { count, rows } = await Detection.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["created_at", "DESC"]],
      attributes: [
        "id",
        "domain",
        "url",
        "element_type",
        "detection_level",
        "confidence_score",
        "action_taken",
        "created_at",
      ],
    });

    const totalPages = Math.ceil(count / limit);

    return paginatedResponse(
      res,
      rows,
      {
        currentPage: parseInt(page),
        totalPages,
        totalItems: count,
        itemsPerPage: parseInt(limit),
      },
      "Detections retrieved successfully"
    );
  } catch (error) {
    logger.error("Get detections error:", error);
    return errorResponse(res, "Failed to get detections", 500);
  }
};

export const getStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = "7d" } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case "24h":
        startDate.setHours(startDate.getHours() - 24);
        break;
      case "7d":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(startDate.getDate() - 30);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    // Get total counts by level
    const stats = await Detection.findAll({
      where: {
        user_id: userId,
        created_at: {
          [Op.gte]: startDate,
          [Op.lte]: endDate,
        },
      },
      attributes: [
        "detection_level",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["detection_level"],
      raw: true,
    });

    // Format stats
    const formattedStats = {
      total: 0,
      low: 0,
      medium: 0,
      high: 0,
    };

    stats.forEach((stat) => {
      formattedStats[stat.detection_level] = parseInt(stat.count);
      formattedStats.total += parseInt(stat.count);
    });

    return successResponse(
      res,
      {
        stats: formattedStats,
        period,
      },
      "Statistics retrieved successfully"
    );
  } catch (error) {
    logger.error("Get stats error:", error);
    return errorResponse(res, "Failed to get statistics", 500);
  }
};

export const getConfig = async (req, res) => {
  try {
    // Return user-specific configuration for extension
    const config = {
      scanInterval: 5000, // 5 seconds
      detectionThresholds: {
        low: 0.3,
        medium: 0.6,
        high: 0.8,
      },
      autoActions: {
        low: "show_modal",
        medium: "hide_element",
        high: "block_element",
      },
      whitelistedDomains: [],
      blacklistedDomains: [],
    };

    return successResponse(
      res,
      { config },
      "Configuration retrieved successfully"
    );
  } catch (error) {
    logger.error("Get config error:", error);
    return errorResponse(res, "Failed to get configuration", 500);
  }
};

// Simulate AI detection - replace with actual AI service
function simulateAIDetection() {
  const levels = ["low", "medium", "high"];
  const level = levels[Math.floor(Math.random() * levels.length)];

  let confidence;
  switch (level) {
    case "low":
      confidence = Math.random() * 0.4 + 0.1; // 0.1 - 0.5
      break;
    case "medium":
      confidence = Math.random() * 0.3 + 0.4; // 0.4 - 0.7
      break;
    case "high":
      confidence = Math.random() * 0.3 + 0.7; // 0.7 - 1.0
      break;
  }

  return {
    level,
    confidence: Math.round(confidence * 10000) / 10000, // 4 decimal places
  };
}
