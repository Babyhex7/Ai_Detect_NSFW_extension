const { DataTypes } = require("sequelize");
const database = require("../services/database");

const Detection = database.define(
  "Detection",
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
    imageUrl: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    domain: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    pageUrl: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    predictions: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    confidence: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
        max: 1,
      },
    },
    riskLevel: {
      type: DataTypes.ENUM("LOW", "MEDIUM", "HIGH"),
      allowNull: false,
    },
    action: {
      type: DataTypes.ENUM("ignore", "close", "block"),
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    imageSize: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {
        width: 0,
        height: 0,
      },
    },
    processingTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Processing time in milliseconds",
    },
    feedback: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
    },
    isBlocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
  },
  {
    tableName: "detections",
    timestamps: true,
    indexes: [
      {
        fields: ["userId"],
      },
      {
        fields: ["domain"],
      },
      {
        fields: ["riskLevel"],
      },
      {
        fields: ["createdAt"],
      },
      {
        fields: ["userId", "createdAt"],
      },
    ],
  }
);

// Instance methods
Detection.prototype.addFeedback = async function (feedbackData) {
  this.feedback = {
    ...this.feedback,
    ...feedbackData,
    submittedAt: new Date(),
  };
  await this.save();
  return this.feedback;
};

Detection.prototype.markAsBlocked = async function () {
  this.isBlocked = true;
  this.action = "block";
  await this.save();
};

// Static methods
Detection.getStatsByUser = async function (userId, timeframe = "7d") {
  const where = { userId };

  // Add time filter
  if (timeframe !== "all") {
    const days = parseInt(timeframe.replace("d", ""));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    where.createdAt = {
      [database.Sequelize.Op.gte]: startDate,
    };
  }

  const [total, byRiskLevel, byDomain] = await Promise.all([
    Detection.count({ where }),
    Detection.findAll({
      where,
      attributes: [
        "riskLevel",
        [database.Sequelize.fn("COUNT", database.Sequelize.col("id")), "count"],
      ],
      group: ["riskLevel"],
      raw: true,
    }),
    Detection.findAll({
      where,
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
    total,
    byRiskLevel: byRiskLevel.reduce(
      (acc, item) => {
        acc[item.riskLevel.toLowerCase()] = parseInt(item.count);
        return acc;
      },
      { low: 0, medium: 0, high: 0 }
    ),
    topDomains: byDomain,
  };
};

module.exports = Detection;
