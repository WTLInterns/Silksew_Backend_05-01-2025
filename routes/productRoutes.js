const express = require('express');
const router = express.Router();
const multer = require('multer'); // To handle file uploads
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductList,
} = require('../controllers/productController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// Middleware to validate MongoDB ObjectId
const validateObjectId = (req, res, next) => {
  const mongoose = require('mongoose');
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid product ID' });
  }
  next();
};

// Setup Multer for file handling
const storage = multer.memoryStorage(); // Store files in memory before uploading to GridFS
const upload = multer({ storage: storage });

// Public routes
router.get('/', getAllProducts); // Get all products
router.get('/list', getProductList); // Display paginated product list
router.get('/:id', validateObjectId, getProductById); // Get product by ID

// Admin-only routes (protected by auth middleware)
router.post(
  '/',
  protect,
  isAdmin,
  upload.array('images', 5), // Allow multiple images, limit to 5 files
  createProduct
); // Create a new product with image uploads

router.put(
  '/:id',
  protect,
  isAdmin,
  validateObjectId,
  upload.array('images', 5), // Allow updating images if needed
  updateProduct
); // Update a product

router.delete(
  '/:id',
  protect,
  isAdmin,
  validateObjectId,
  deleteProduct
); // Delete a product

module.exports = router;
