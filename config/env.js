// config/env.js
require('dotenv').config(); // Load environment variables from .env file

module.exports = {
  MONGO_URI: process.env.DB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
};
