import { User, UserSession } from "../models/index.js";
import { generateTokens } from "../utils/jwt.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { validationResult } from "express-validator";
import logger from "../config/logger.js";

export const register = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, "Validation failed", 400, errors.array());
    }

    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return errorResponse(res, "Email already registered", 400);
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
    });

    logger.info(`New user registered: ${email}`);

    return successResponse(
      res,
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      "User registered successfully",
      201
    );
  } catch (error) {
    logger.error("Register error:", error);
    return errorResponse(res, "Registration failed", 500);
  }
};

export const login = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, "Validation failed", 400, errors.array());
    }

    const { email, password } = req.body;

    // Find user and include password for validation
    const user = await User.findOne({
      where: { email },
      attributes: [
        "id",
        "name",
        "email",
        "password",
        "is_active",
        "last_login",
      ],
    });

    if (!user || !user.is_active) {
      return errorResponse(res, "Invalid credentials", 401);
    }

    // Validate password
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return errorResponse(res, "Invalid credentials", 401);
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Save refresh token to database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    await UserSession.create({
      user_id: user.id,
      refresh_token: refreshToken,
      device_info: {
        userAgent: req.headers["user-agent"],
        ip: req.ip,
      },
      ip_address: req.ip,
      user_agent: req.headers["user-agent"],
      expires_at: expiresAt,
    });

    // Update last login
    await user.update({ last_login: new Date() });

    logger.info(`User logged in: ${email}`);

    return successResponse(
      res,
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        token: accessToken,
        refreshToken,
      },
      "Login successful"
    );
  } catch (error) {
    logger.error("Login error:", error);
    return errorResponse(res, "Login failed", 500);
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return errorResponse(res, "Refresh token required", 400);
    }

    // Find session with the refresh token
    const session = await UserSession.findOne({
      where: {
        refresh_token: refreshToken,
        is_active: true,
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "is_active"],
        },
      ],
    });

    if (!session || !session.user || !session.user.is_active) {
      return errorResponse(res, "Invalid refresh token", 401);
    }

    // Check if token is expired
    if (new Date() > session.expires_at) {
      await session.update({ is_active: false });
      return errorResponse(res, "Refresh token expired", 401);
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      session.user.id
    );

    // Update session with new refresh token
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 30);

    await session.update({
      refresh_token: newRefreshToken,
      expires_at: newExpiresAt,
    });

    return successResponse(
      res,
      {
        token: accessToken,
        refreshToken: newRefreshToken,
      },
      "Token refreshed successfully"
    );
  } catch (error) {
    logger.error("Refresh token error:", error);
    return errorResponse(res, "Token refresh failed", 500);
  }
};

export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Deactivate the session
      await UserSession.update(
        { is_active: false },
        { where: { refresh_token: refreshToken } }
      );
    }

    logger.info(`User logged out: ${req.user?.email || "Unknown"}`);

    return successResponse(res, null, "Logout successful");
  } catch (error) {
    logger.error("Logout error:", error);
    return errorResponse(res, "Logout failed", 500);
  }
};

export const getProfile = async (req, res) => {
  try {
    return successResponse(
      res,
      {
        user: req.user,
      },
      "Profile retrieved successfully"
    );
  } catch (error) {
    logger.error("Get profile error:", error);
    return errorResponse(res, "Failed to get profile", 500);
  }
};

export const updateProfile = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, "Validation failed", 400, errors.array());
    }

    const { name } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    await user.update({ name });

    logger.info(`Profile updated for user: ${user.email}`);

    return successResponse(
      res,
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      "Profile updated successfully"
    );
  } catch (error) {
    logger.error("Update profile error:", error);
    return errorResponse(res, "Failed to update profile", 500);
  }
};

export const verifyToken = async (req, res) => {
  try {
    return successResponse(
      res,
      {
        user: req.user,
      },
      "Token is valid"
    );
  } catch (error) {
    logger.error("Verify token error:", error);
    return errorResponse(res, "Token verification failed", 500);
  }
};
