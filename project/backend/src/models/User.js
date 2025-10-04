const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const database = require('../services/database');

const User = database.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [6, 100],
    },
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [2, 50],
    },
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  settings: {
    type: DataTypes.JSON,
    defaultValue: {
      detectionEnabled: true,
      captureInterval: 5000,
      privacyMode: false,
      whitelistedDomains: [],
      blacklistedDomains: [],
      notifications: true,
      autoBlock: false
    },
  },
  profile: {
    type: DataTypes.JSON,
    defaultValue: {
      avatar: null,
      timezone: 'UTC',
      language: 'id',
      theme: 'light'
    },
  },
}, {
  tableName: 'users',
  timestamps: true,
  hooks: {
    beforeSave: async (user) => {
      if (user.changed('password')) {
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        user.password = await bcrypt.hash(user.password, saltRounds);
      }
    },
  },
});

// Instance methods
User.prototype.validatePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

User.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

User.prototype.updateLastLogin = async function() {
  this.lastLogin = new Date();
  await this.save();
};

User.prototype.updateSettings = async function(newSettings) {
  this.settings = { ...this.settings, ...newSettings };
  await this.save();
  return this.settings;
};

module.exports = User;