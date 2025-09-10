const router = require("express").Router();
const User = require("../models/User");
const {
  verifyToken,
  verifyTokenAndAuthorization,
} = require("./verifyToken");

// GET USER FAVORITES
router.get("/favorites/:userId", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('favorites');
    if (!user) {
      return res.status(404).json("User not found!");
    }
    res.status(200).json(user.favorites);
  } catch (err) {
    res.status(500).json(err);
  }
});

// ADD TO FAVORITES
router.put("/favorites/add/:userId", verifyTokenAndAuthorization, async (req, res) => {
  const { productId } = req.body;
  if (!productId) {
    return res.status(400).json("Product ID is required");
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.userId,
      { $addToSet: { favorites: productId } }, // Use $addToSet to avoid duplicates
      { new: true }
    ).populate('favorites');

    if (!updatedUser) {
      return res.status(404).json("User not found!");
    }

    res.status(200).json(updatedUser.favorites);
  } catch (err) {
    res.status(500).json(err);
  }
});

// REMOVE FROM FAVORITES
router.put("/favorites/remove/:userId", verifyTokenAndAuthorization, async (req, res) => {
  const { productId } = req.body;
  if (!productId) {
    return res.status(400).json("Product ID is required");
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.userId,
      { $pull: { favorites: productId } },
      { new: true }
    ).populate('favorites');

    if (!updatedUser) {
      return res.status(404).json("User not found!");
    }

    res.status(200).json(updatedUser.favorites);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;