// config/jwtConfig.js

module.exports = {
  secret: process.env.JWT_SECRET || 'supersecretkey',
  expiresIn: '30d', // Token expiration time
};
