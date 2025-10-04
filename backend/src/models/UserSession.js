import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const UserSession = sequelize.define(
  "UserSession",
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
    refresh_token: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    device_info: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: "user_sessions",
    indexes: [
      {
        fields: ["user_id"],
      },
      {
        fields: ["refresh_token"],
      },
      {
        fields: ["expires_at"],
      },
    ],
  }
);

export default UserSession;
