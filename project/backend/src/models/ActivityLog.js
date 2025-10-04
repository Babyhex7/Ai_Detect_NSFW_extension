const { DataTypes } = require("sequelize");
const { sequelize } = require("../services/database");

const ActivityLog = sequelize.define(
  "ActivityLog",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [
          [
            "login",
            "logout",
            "register",
            "password_change",
            "settings_update",
            "detection_scan",
            "block_content",
          ],
        ],
      },
    },
    details: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    success: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    timestamps: true,
    indexes: [
      { fields: ["userId"] },
      { fields: ["action"] },
      { fields: ["createdAt"] },
    ],
  }
);

// Static method to log activity
ActivityLog.logActivity = async function (userId, action, details = {}) {
  try {
    await this.create({
      userId,
      action,
      details: {
        ...details,
        timestamp: new Date().toISOString(),
      },
      ipAddress: details.ipAddress,
      userAgent: details.userAgent,
      success: details.success !== false,
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
};

module.exports = ActivityLog;
