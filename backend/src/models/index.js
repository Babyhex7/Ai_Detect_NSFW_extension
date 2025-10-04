import User from "./User.js";
import Detection from "./Detection.js";
import UserSession from "./UserSession.js";

// Define associations
User.hasMany(Detection, { foreignKey: "user_id", as: "detections" });
Detection.belongsTo(User, { foreignKey: "user_id", as: "user" });

User.hasMany(UserSession, { foreignKey: "user_id", as: "sessions" });
UserSession.belongsTo(User, { foreignKey: "user_id", as: "user" });

export { User, Detection, UserSession };
