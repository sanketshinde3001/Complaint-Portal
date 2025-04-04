const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');

// Load environment variables from .env file in the server directory
dotenv.config(); // Loads .env from the current directory (server/)

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Optional: Ensures HTTPS URLs are generated
});

module.exports = cloudinary;

