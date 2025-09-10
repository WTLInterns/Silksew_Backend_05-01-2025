const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  addToFavorites,
  getFavorites,
  removeFavorite,
  removeFavoriteByProduct,
} = require('../controllers/favoriteController');

const router = express.Router();

// Apply protect middleware to all routes
router.use(protect);

// Toggle favorite status (add or remove)
router.post('/', addToFavorites);

// Get all favorite products for the logged-in user
router.get('/', getFavorites);

// Remove by favorite id
router.delete('/:id', removeFavorite);

// Remove by product id (convenience)
router.delete('/byProduct/:productId', removeFavoriteByProduct);

module.exports = router;
