const jwt = require("jsonwebtoken");
const { User } = require("../models");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Access denied. No token provided.",
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from database
      const user = await User.findByPk(decoded.userId);

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          error: "Access denied. User not found or inactive.",
        });
      }

      // Add user to request object
      req.user = user;
      req.userId = user.id;

      next();
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          error: "Access denied. Token expired.",
        });
      }

      if (jwtError.name === "JsonWebTokenError") {
        return res.status(401).json({
          success: false,
          error: "Access denied. Invalid token.",
        });
      }

      throw jwtError;
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error during authentication.",
    });
  }
};

module.exports = authMiddleware;
