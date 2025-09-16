const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductList,
  getProductsBySubcategory,
  getProductsByCategory,
} = require('../controllers/productController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// Middleware to validate MongoDB ObjectId (only for routes with :id parameter)
const validateObjectId = (req, res, next) => {
  const mongoose = require('mongoose');
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid product ID' });
  }
  next();
};

// Setup Multer for file handling
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Public routes
router.get('/', getAllProducts);
router.get('/list', getProductList);
router.get('/by-subcategory', getProductsBySubcategory); // This should NOT have validateObjectId middleware
router.get('/by-category', getProductsByCategory);
router.get('/:id', validateObjectId, getProductById); // This SHOULD have validateObjectId

// Admin-only routes (protected by auth middleware)
router.post(
  '/',
  protect,
  isAdmin,
  upload.array('images', 5),
  createProduct
);

router.put(
  '/:id',
  protect,
  isAdmin,
  validateObjectId, // This should have validateObjectId
  upload.array('images', 5),
  updateProduct
);

router.delete(
  '/:id',
  protect,
  isAdmin,
  validateObjectId, // This should have validateObjectId
  deleteProduct
);

module.exports = router;



