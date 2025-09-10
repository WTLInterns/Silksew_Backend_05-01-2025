const Favorite = require('../models/favoriteModel');
const Product = require('../models/Product');

// @desc    Toggle product favorite (add if not exists, remove if exists)
// @route   POST /api/favorites
// @access  Private
const addToFavorites = async (req, res) => {
  const { productId, notes = '', customName = '' } = req.body;
  const userId = req.user._id;

  if (!productId) {
    return res.status(400).json({ message: 'productId is required' });
  }

  try {
    // Ensure product exists
    const product = await Product.findById(productId).select('_id');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Try to find an existing favorite
    const existing = await Favorite.findOne({ userId, productId });
    if (existing) {
      await Favorite.deleteOne({ _id: existing._id });
      return res.status(200).json({ message: 'Product removed from favorites', removed: true });
    }

    const created = await Favorite.create({ userId, productId, notes, customName });
    return res.status(201).json({ message: 'Product added to favorites', favorite: created, removed: false });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    // Handle duplicate key error gracefully
    if (error.code === 11000) {
      return res.status(200).json({ message: 'Already in favorites', duplicate: true });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get user's favorite products (populated)
// @route   GET /api/favorites
// @access  Private
const getFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.user._id })
      .populate('productId')
      .sort({ createdAt: -1 });

    // Map to product documents with minimal shape for frontend
    const products = favorites
      .filter(f => f.productId)
      .map(f => ({ ...f.productId.toObject(), _favoriteId: f._id }));

    res.json(products);
  } catch (error) {
    console.error('Error getting favorites:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Remove favorite by favorite id
// @route   DELETE /api/favorites/:id
// @access  Private
const removeFavorite = async (req, res) => {
  try {
    const result = await Favorite.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!result) {
      return res.status(404).json({ message: 'Favorite not found' });
    }

    res.json({ message: 'Product removed from favorites' });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Remove favorite by product id (helper for UI)
// @route   DELETE /api/favorites/byProduct/:productId
// @access  Private
const removeFavoriteByProduct = async (req, res) => {
  const { productId } = req.params;
  try {
    const result = await Favorite.findOneAndDelete({
      productId,
      userId: req.user._id,
    });

    if (!result) {
      return res.status(404).json({ message: 'Favorite not found' });
    }

    res.json({ message: 'Product removed from favorites' });
  } catch (error) {
    console.error('Error removing favorite by product:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { addToFavorites, getFavorites, removeFavorite, removeFavoriteByProduct };
