// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  resetPassword,
  forgotPassword,
  changePassword,
  getUserProfileDetail,
  updateUserProfileDetail,
  googleAuth,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const User = require("../models/User");

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", googleAuth);

// Protected routes
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);

// Favorites routes (Protected)
router.get("/favorites/:userId", protect, async (req, res) => {
  try {
    if (String(req.user._id) !== String(req.params.userId) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const user = await User.findById(req.params.userId).populate('favorites');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.favorites || []);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

router.put("/favorites/add/:userId", protect, async (req, res) => {
  const { productId } = req.body;
  if (!productId) return res.status(400).json({ message: 'Product ID is required' });
  try {
    if (String(req.user._id) !== String(req.params.userId) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const updated = await User.findByIdAndUpdate(
      req.params.userId,
      { $addToSet: { favorites: productId } },
      { new: true }
    ).populate('favorites');
    if (!updated) return res.status(404).json({ message: 'User not found' });
    res.json(updated.favorites || []);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

router.put("/favorites/remove/:userId", protect, async (req, res) => {
  const { productId } = req.body;
  if (!productId) return res.status(400).json({ message: 'Product ID is required' });
  try {
    if (String(req.user._id) !== String(req.params.userId) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const updated = await User.findByIdAndUpdate(
      req.params.userId,
      { $pull: { favorites: productId } },
      { new: true }
    ).populate('favorites');
    if (!updated) return res.status(404).json({ message: 'User not found' });
    res.json(updated.favorites || []);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// send email link for reset-password
router.post("/sendpasswordlink", resetPassword);

// verify user for forgot password time
router.get("/forgotpassword/:id/:token", forgotPassword);

// change password
router.post("/:id/:token", changePassword);

// get user profile details
router.get("/user-profile", protect, getUserProfileDetail);
// update user profile details
router.put("/update-user-profile", protect, updateUserProfileDetail);

module.exports = router;
