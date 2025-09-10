const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Add an item to the user's cart
const addItemToCart = async (userId, productId, quantity) => {
    try {
        // Check if the product exists
        const product = await Product.findById(productId);
        if (!product) {
            throw new Error('Product not found');
        }

        // Find the user's cart, or create one if it doesn't exist
        let cart = await Cart.findOne({ user: userId });

        if (!cart) {
            // If no cart exists for the user, create a new one
            cart = new Cart({ user: userId, items: [] });
        }

        // Check if the product is already in the cart
        const existingItem = cart.items.find(item => item.product.toString() === productId);

        if (existingItem) {
            // If the item is already in the cart, update the quantity
            existingItem.quantity += quantity;
        } else {
            // If the item is not in the cart, add it
            cart.items.push({ product: productId, quantity });
        }

        // Save the cart
        await cart.save();
        return cart;
    } catch (err) {
        throw new Error('Error adding item to cart: ' + err.message);
    }
};

// Remove an item from the user's cart
const removeItemFromCart = async (userId, productId) => {
    try {
        // Find the user's cart
        const cart = await Cart.findOne({ user: userId });

        if (!cart) {
            throw new Error('Cart not found');
        }

        // Remove the item from the cart
        cart.items = cart.items.filter(item => item.product.toString() !== productId);

        // Save the cart
        await cart.save();
        return cart;
    } catch (err) {
        throw new Error('Error removing item from cart: ' + err.message);
    }
};

// Update the quantity of an item in the user's cart
const updateItemQuantity = async (userId, productId, quantity) => {
    try {
        // Find the user's cart
        const cart = await Cart.findOne({ user: userId });

        if (!cart) {
            throw new Error('Cart not found');
        }

        // Find the item in the cart
        const item = cart.items.find(item => item.product.toString() === productId);

        if (!item) {
            throw new Error('Item not found in cart');
        }

        // Update the item's quantity
        if (quantity <= 0) {
            throw new Error('Quantity must be greater than 0');
        }
        item.quantity = quantity;

        // Save the cart
        await cart.save();
        return cart;
    } catch (err) {
        throw new Error('Error updating item quantity: ' + err.message);
    }
};

// Get all items in the user's cart
const getCartItems = async (userId) => {
    try {
        // Find the user's cart and populate product details
        const cart = await Cart.findOne({ user: userId }).populate('items.product');

        if (!cart) {
            throw new Error('Cart not found');
        }

        return cart.items;
    } catch (err) {
        throw new Error('Error fetching cart items: ' + err.message);
    }
};

// Clear the user's cart
const clearCart = async (userId) => {
    try {
        // Find the user's cart
        const cart = await Cart.findOne({ user: userId });

        if (!cart) {
            throw new Error('Cart not found');
        }

        // Clear the cart's items
        cart.items = [];

        // Save the cart
        await cart.save();
        return cart;
    } catch (err) {
        throw new Error('Error clearing cart: ' + err.message);
    }
};

module.exports = {
    addItemToCart,
    removeItemFromCart,
    updateItemQuantity,
    getCartItems,
    clearCart,
};
