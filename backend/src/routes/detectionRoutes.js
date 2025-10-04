import express from "express";
import { body, query } from "express-validator";
import {
  analyzeElement,
  logAction,
  getDetections,
  getStats,
  getConfig,
} from "../controllers/detectionController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Validation rules
const analyzeValidation = [
  body("domain").trim().notEmpty().withMessage("Domain is required"),
  body("url").isURL().withMessage("Valid URL is required"),
  body("elementType")
    .isIn(["image", "video"])
    .withMessage("Element type must be image or video"),
  body("fileSize")
    .optional()
    .isInt({ min: 0 })
    .withMessage("File size must be a positive integer"),
];

const logActionValidation = [
  body("detectionId")
    .isInt({ min: 1 })
    .withMessage("Valid detection ID is required"),
  body("action")
    .isIn(["ignored", "hidden", "blocked", "tab_closed"])
    .withMessage("Invalid action type"),
];

const getDetectionsValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("level")
    .optional()
    .isIn(["low", "medium", "high"])
    .withMessage("Invalid detection level"),
  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("Start date must be in ISO format"),
  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be in ISO format"),
];

const getStatsValidation = [
  query("period")
    .optional()
    .isIn(["24h", "7d", "30d"])
    .withMessage("Period must be 24h, 7d, or 30d"),
];

// Routes
router.post("/analyze-element", analyzeValidation, analyzeElement);
router.post("/log-action", logActionValidation, logAction);
router.get("/detections", getDetectionsValidation, getDetections);
router.get("/stats", getStatsValidation, getStats);
router.get("/config", getConfig);

export default router;
