import jwt from "jsonwebtoken";
import { User } from "../models/index.js";
import logger from "../config/logger.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findByPk(decoded.userId, {
        attributes: { exclude: ["password"] },
      });

      if (!user || !user.is_active) {
        return res.status(401).json({
          success: false,
          message: "Invalid token or user not found",
        });
      }

      req.user = user;
      next();
    } catch (jwtError) {
      logger.error("JWT verification failed:", jwtError);
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }
  } catch (error) {
    logger.error("Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication error",
    });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.userId, {
          attributes: { exclude: ["password"] },
        });

        if (user && user.is_active) {
          req.user = user;
        }
      } catch (jwtError) {
        // Token invalid but continue without auth
        logger.debug("Optional auth - invalid token:", jwtError.message);
      }
    }

    next();
  } catch (error) {
    logger.error("Optional auth middleware error:", error);
    next();
  }
};
