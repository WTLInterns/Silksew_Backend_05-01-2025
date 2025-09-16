
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const mongoose = require('mongoose');
const User = require('../models/User');

// Add item to cart
const addItemToCart = async (req, res) => {
  try {
  
    const { productId, size,color, quantity = 1} = req.body;
    const userId = req.user._id;

    console.log(req.body);

    // Validate productId and quantity
    if (!mongoose.Types.ObjectId.isValid(productId) || quantity < 1) {
      return res.status(400).json({ message: 'Invalid product ID or quantity' });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    
    console.log("###########",product)
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Find the user to get the userName
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find or create cart
    let cart = await Cart.findOneAndUpdate(
      { userId },
      { $set: { userName: user.name } }, // Update userName if it has changed
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Check if the product already exists in the cart
    const productExists = cart.items.find(
      (item) => item.productId.equals(productId) && item.size === size
    );
    if (productExists) {
      productExists.quantity += quantity; // Increment quantity
    } else {
      cart.items.push({ productId: productId, size,color, quantity }); // Add new item with quantity
    }

    await cart.save();
    res.status(201).json({ message: 'Item added to cart', cart });
  } catch (error) {
    res.status(500).json({ message: 'Error adding item to cart', error: error.message });
  }
};

// Rest of the controller methods remain the same
const getUserCart = async (req, res) => {
  try {
    // const {userId} = req.body
    const userId = req?.user?._id;
    console.log(userId)
    if(!userId){
      return res.status(404).json({ message: 'user is not found' });
    }
    let cart = await Cart.findOne({userId});
    if (!cart) {
      // Return an empty cart structure if no cart is found
      cart = { items: []};
    }
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cart', error: error.message });
  }
};

// const removeItemFromCart = async (req, res) => {
//   try {
//     const { productId, size } = req.body;

//     // Validate the productId
//     if (!mongoose.Types.ObjectId.isValid(productId)) {
//       return res.status(400).json({ message: 'Invalid product ID' });
//     }

//     const cart = await Cart.findOne({ userId: req.user._id });
//     if (!cart) return res.status(404).json({ message: 'Cart not found' });

//     // Filter the items by both productId and size
//     const itemIndex = cart.items.findIndex(item => item.productId.equals(productId) && item.size === size);

//     // If the item is found, remove it
//     if (itemIndex !== -1) {
//       cart.items.splice(itemIndex, 1);
//       await cart.save();

//       return res.status(200).json({ message: 'Item removed from cart', cart });
//     } else {
//       return res.status(404).json({ message: 'Item not found in cart' });
//     }

//   } catch (error) {
//     res.status(500).json({ message: 'Error removing item from cart', error: error.message });
//   }
// };

const removeItemFromCart = async (req, res) => {
  try {
    const { productId, size, color } = req.body;

    // Validate productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    // Match productId + size + color
    const itemIndex = cart.items.findIndex(
      (item) =>
        item.productId.equals(productId) &&
        item.size === size &&
        item.color === color
    );

    if (itemIndex !== -1) {
      if (cart.items[itemIndex].quantity > 1) {
        // ✅ Decrease quantity if more than 1
        cart.items[itemIndex].quantity -= 1;
      } else {
        // ✅ Remove item completely if quantity = 1
        cart.items.splice(itemIndex, 1);
      }

      await cart.save();
      return res.status(200).json({
        message: "Item removed from cart",
        cart,
      });
    } else {
      return res.status(404).json({ message: "Item not found in cart" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error removing item from cart", error: error.message });
  }
};

const updateItemQuantity = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId) || !quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Invalid product ID or quantity' });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const item = cart.items.find((item) => item.product.equals(productId));
    if (item) {
      item.quantity = quantity;
      await cart.save();
      res.status(200).json({ message: 'Cart updated successfully', cart });
    } else {
      res.status(404).json({ message: 'Item not found in cart' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating cart', error: error.message });
  }
};

const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOneAndDelete({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    res.status(200).json({ message: 'Cart cleared successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error clearing cart', error: error.message });
  }
};


const getProductsByIds = async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "Invalid or missing product IDs" });
  }

  try {
    const products = await Product.find({
      _id: { $in: ids },
    });

    return res.status(200).json({ products });
  } catch (error) {
    console.error("Error fetching products by IDs:", error.message);
    return res.status(500).json({ error: "Server error while fetching products" });
  }
};



module.exports = {
  addItemToCart,
  getUserCart,
  removeItemFromCart,
  updateItemQuantity,
  clearCart,
  getProductsByIds
};