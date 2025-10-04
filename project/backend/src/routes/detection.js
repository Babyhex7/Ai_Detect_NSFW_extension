const express = require("express");
const { body, validationResult } = require("express-validator");
const { Detection, ActivityLog } = require("../models");
const authMiddleware = require("../middleware/auth");
const nudeNetService = require("../services/nudenet");
const queueService = require("../services/queue");

const router = express.Router();

// Validation rules
const detectValidation = [
  body("image").notEmpty().withMessage("Image data is required"),
  body("url").optional().isURL().withMessage("Invalid URL format"),
];

// Initialize detection processor
queueService.setProcessor("detection", async (job) => {
  const { imageData, userId, metadata } = job.data;

  try {
    // Call NudeNet service
    const detectionResult = await nudeNetService.detectImage(imageData.dataUrl);

    if (!detectionResult.success) {
      throw new Error(detectionResult.error);
    }

    // Classify risk level
    const riskLevel = nudeNetService.classifyRiskLevel(
      detectionResult.data.predictions,
      detectionResult.data.confidence
    );

    // Save to database
    const detection = await Detection.create({
      userId,
      imageUrl: metadata.url || "unknown",
      domain: metadata.domain || "unknown",
      pageUrl: metadata.pageUrl || metadata.url || "unknown",
      predictions: detectionResult.data.predictions,
      confidence: detectionResult.data.confidence,
      riskLevel,
      userAgent: metadata.userAgent,
      imageSize: {
        width: imageData.width || 0,
        height: imageData.height || 0,
      },
      processingTime: detectionResult.data.processingTime,
      metadata: metadata.additionalData || {},
    });

    // Log activity
    await ActivityLog.logActivity(userId, "content_detected", {
      url: metadata.url,
      domain: metadata.domain,
      riskLevel,
      confidence: detectionResult.data.confidence,
      detectionId: detection.id,
    });

    return {
      detectionId: detection.id,
      predictions: detectionResult.data.predictions,
      confidence: detectionResult.data.confidence,
      riskLevel,
      processingTime: detectionResult.data.processingTime,
    };
  } catch (error) {
    console.error("Detection processing error:", error);
    throw error;
  }
});

// Detect image content
router.post("/", authMiddleware, detectValidation, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors.array(),
      });
    }

    const { image, url, width, height, timestamp, userAgent, domain } =
      req.body;

    // Validate image data
    if (!image || !image.startsWith("data:image/")) {
      return res.status(400).json({
        success: false,
        error: "Invalid image data format",
      });
    }

    // Prepare job data
    const jobData = {
      imageData: {
        dataUrl: image,
        width,
        height,
      },
      userId: req.userId,
      metadata: {
        url,
        domain,
        pageUrl: url,
        userAgent,
        timestamp,
        additionalData: {
          ipAddress: req.ip,
        },
      },
    };

    // Add to queue
    const job = await queueService.addJob("detection", jobData, {
      priority: 1,
    });

    res.json({
      success: true,
      data: {
        jobId: job.id,
        status: "queued",
        estimatedProcessingTime: "5-10 seconds",
      },
      message: "Image queued for detection",
    });
  } catch (error) {
    console.error("Detection API error:", error);
    res.status(500).json({
      success: false,
      error: "Detection request failed",
    });
  }
});

// Get detection result
router.get("/result/:jobId", authMiddleware, async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = queueService.getJob("detection", jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: "Job not found",
      });
    }

    if (job.status === "processing") {
      return res.json({
        success: true,
        data: {
          status: "processing",
          progress: "Detection in progress...",
        },
      });
    }

    if (job.status === "completed") {
      return res.json({
        success: true,
        data: {
          status: "completed",
          result: job.result,
        },
      });
    }

    if (job.status === "failed") {
      return res.status(500).json({
        success: false,
        error: "Detection failed",
        details: job.lastError,
      });
    }

    res.json({
      success: true,
      data: {
        status: job.status,
      },
    });
  } catch (error) {
    console.error("Get detection result error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get detection result",
    });
  }
});

// Get detection history
router.get("/history", authMiddleware, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      riskLevel,
      domain,
      startDate,
      endDate,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = { userId: req.userId };

    if (riskLevel) {
      where.riskLevel = riskLevel.split(",");
    }

    if (domain) {
      where.domain = domain.split(",");
    }

    if (startDate && endDate) {
      where.createdAt = {
        [require("sequelize").Op.between]: [
          new Date(startDate),
          new Date(endDate),
        ],
      };
    }

    const { count, rows } = await Detection.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get detection history error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get detection history",
    });
  }
});

// Get single detection
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const detection = await Detection.findOne({
      where: {
        id,
        userId: req.userId,
      },
    });

    if (!detection) {
      return res.status(404).json({
        success: false,
        error: "Detection not found",
      });
    }

    res.json({
      success: true,
      data: detection,
    });
  } catch (error) {
    console.error("Get detection error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get detection",
    });
  }
});

// Submit feedback
router.post("/:id/feedback", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { type, comment } = req.body;

    const detection = await Detection.findOne({
      where: {
        id,
        userId: req.userId,
      },
    });

    if (!detection) {
      return res.status(404).json({
        success: false,
        error: "Detection not found",
      });
    }

    // Add feedback
    await detection.addFeedback({
      type,
      comment,
      userId: req.userId,
    });

    res.json({
      success: true,
      message: "Feedback submitted successfully",
    });
  } catch (error) {
    console.error("Submit feedback error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to submit feedback",
    });
  }
});

module.exports = router;
