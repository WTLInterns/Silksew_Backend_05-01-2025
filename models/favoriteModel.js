const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'removed'],
    default: 'active'
  },
  notes: {
    type: String,
    default: ''
  },
  customName: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Prevent duplicate favorites
favoriteSchema.index({ userId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);
