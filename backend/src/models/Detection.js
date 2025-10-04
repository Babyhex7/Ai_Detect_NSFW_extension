import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Detection = sequelize.define(
  "Detection",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    domain: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    url: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    element_type: {
      type: DataTypes.ENUM("image", "video"),
      allowNull: false,
    },
    file_size: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    detection_level: {
      type: DataTypes.ENUM("low", "medium", "high"),
      allowNull: false,
    },
    confidence_score: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: true,
      validate: {
        min: 0,
        max: 1,
      },
    },
    action_taken: {
      type: DataTypes.ENUM("ignored", "hidden", "blocked", "tab_closed"),
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    tableName: "detections",
    indexes: [
      {
        fields: ["user_id"],
      },
      {
        fields: ["domain"],
      },
      {
        fields: ["detection_level"],
      },
      {
        fields: ["created_at"],
      },
    ],
  }
);

export default Detection;
