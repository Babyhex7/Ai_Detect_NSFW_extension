const { DataTypes } = require("sequelize");
const database = require("../services/database");

const ActivityLog = database.define(
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
        model: "users",
        key: "id",
      },
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [
          [
            "page_visit",
            "content_detected",
            "modal_activity",
            "settings_change",
            "login",
            "logout",
          ],
        ],
      },
    },
    action: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    domain: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    data: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
    sessionId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "activity_logs",
    timestamps: true,
    indexes: [
      {
        fields: ["userId"],
      },
      {
        fields: ["type"],
      },
      {
        fields: ["domain"],
      },
      {
        fields: ["createdAt"],
      },
      {
        fields: ["userId", "type"],
      },
    ],
  }
);

// Static methods
ActivityLog.logActivity = async function (userId, type, data = {}) {
  try {
    return await this.create({
      userId,
      type,
      action: data.action || null,
      url: data.url || null,
      domain: data.domain || null,
      userAgent: data.userAgent || null,
      ipAddress: data.ipAddress || null,
      data: data.data || {},
      sessionId: data.sessionId || null,
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
    return null;
  }
};

ActivityLog.getRecentActivity = async function (userId, limit = 50) {
  return await this.findAll({
    where: { userId },
    order: [["createdAt", "DESC"]],
    limit,
  });
};

ActivityLog.getActivityStats = async function (userId, timeframe = "7d") {
  const where = { userId };

  if (timeframe !== "all") {
    const days = parseInt(timeframe.replace("d", ""));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    where.createdAt = {
      [database.Sequelize.Op.gte]: startDate,
    };
  }

  const [totalActivities, byType, byDomain] = await Promise.all([
    ActivityLog.count({ where }),
    ActivityLog.findAll({
      where,
      attributes: [
        "type",
        [database.Sequelize.fn("COUNT", database.Sequelize.col("id")), "count"],
      ],
      group: ["type"],
      raw: true,
    }),
    ActivityLog.findAll({
      where: {
        ...where,
        domain: { [database.Sequelize.Op.ne]: null },
      },
      attributes: [
        "domain",
        [database.Sequelize.fn("COUNT", database.Sequelize.col("id")), "count"],
      ],
      group: ["domain"],
      order: [
        [database.Sequelize.fn("COUNT", database.Sequelize.col("id")), "DESC"],
      ],
      limit: 10,
      raw: true,
    }),
  ]);

  return {
    total: totalActivities,
    byType: byType.reduce((acc, item) => {
      acc[item.type] = parseInt(item.count);
      return acc;
    }, {}),
    topDomains: byDomain,
  };
};

module.exports = ActivityLog;
