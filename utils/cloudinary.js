const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // Your cloud name from Cloudinary
  api_key: process.env.CLOUDINARY_API_KEY,       // Your API key from Cloudinary
  api_secret: process.env.CLOUDINARY_API_SECRET, // Your API secret from Cloudinary
});

module.exports = cloudinary;
