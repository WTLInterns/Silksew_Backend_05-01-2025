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
  getCategoriesSubcategories,
} = require('../controllers/productController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// Middleware to validate MongoDB ObjectId (only for routes with :id parameter)
const validateObjectId = (req, res, next) => {
  // Only validate if there's an id parameter in the request
  if (req.params.id) {
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log(`[DEBUG] Invalid product ID: ${req.params.id}`);
      return res.status(400).json({ message: 'Invalid product ID' });
    }
  }
  next();
};

// Setup Multer for file handling
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Public routes
router.get('/categories-subcategories', getCategoriesSubcategories);
router.get('/', getAllProducts);
router.get('/list', getProductList);
router.get('/by-subcategory', getProductsBySubcategory);
router.get('/by-category', getProductsByCategory);
// Specific routes should come before parameterized routes
// Parameterized routes should come last
router.get('/:id', validateObjectId, getProductById);

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
