const User = require("./User");
const Detection = require("./Detection");
const ActivityLog = require("./ActivityLog");

// Define associations
User.hasMany(Detection, {
  foreignKey: "userId",
  as: "detections",
  onDelete: "CASCADE",
});

Detection.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

User.hasMany(ActivityLog, {
  foreignKey: "userId",
  as: "activities",
  onDelete: "CASCADE",
});

ActivityLog.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

module.exports = {
  User,
  Detection,
  ActivityLog,
};
