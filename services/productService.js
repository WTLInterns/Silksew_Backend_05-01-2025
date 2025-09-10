const Product = require('../models/Product');
const User = require('../models/User'); // For user-specific product operations

// Create a new product (admin only)
const createProduct = async (productData) => {
    try {
        const newProduct = new Product(productData);
        await newProduct.save();
        return newProduct;
    } catch (err) {
        throw new Error('Error creating product: ' + err.message);
    }
};

// Get all products (public)
const getAllProducts = async () => {
    try {
        const products = await Product.find();
        return products;
    } catch (err) {
        throw new Error('Error fetching products: ' + err.message);
    }
};

// Get a specific product by ID (public)
const getProductById = async (productId) => {
    try {
        const product = await Product.findById(productId);
        if (!product) {
            throw new Error('Product not found');
        }
        return product;
    } catch (err) {
        throw new Error('Error fetching product: ' + err.message);
    }
};

// Update a product (admin only)
const updateProduct = async (productId, productData) => {
    try {
        const product = await Product.findByIdAndUpdate(productId, productData, { new: true });
        if (!product) {
            throw new Error('Product not found');
        }
        return product;
    } catch (err) {
        throw new Error('Error updating product: ' + err.message);
    }
};

// Delete a product (admin only)
const deleteProduct = async (productId) => {
    try {
        const product = await Product.findByIdAndDelete(productId);
        if (!product) {
            throw new Error('Product not found');
        }
        return product;
    } catch (err) {
        throw new Error('Error deleting product: ' + err.message);
    }
};

// Get products for a specific user (if users can have products associated with their accounts)
const getUserProducts = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Assuming that products are linked to the user (e.g., through a `userId` field in the product model)
        const userProducts = await Product.find({ user: userId });
        return userProducts;
    } catch (err) {
        throw new Error('Error fetching user products: ' + err.message);
    }
};

// Search products based on query (e.g., by name, category, price range, etc.)
const searchProducts = async (searchQuery) => {
    try {
        const products = await Product.find({
            $or: [
                { name: { $regex: searchQuery, $options: 'i' } },
                { category: { $regex: searchQuery, $options: 'i' } },
                { description: { $regex: searchQuery, $options: 'i' } } // Added description field for better search
            ]
        });
        return products;
    } catch (err) {
        throw new Error('Error searching for products: ' + err.message);
    }
};

// Get products by price range (public)
const getProductsByPriceRange = async (minPrice, maxPrice) => {
    try {
        const products = await Product.find({
            price: { $gte: minPrice, $lte: maxPrice }
        });
        return products;
    } catch (err) {
        throw new Error('Error fetching products by price range: ' + err.message);
    }
};

module.exports = {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    getUserProducts,
    searchProducts,
    getProductsByPriceRange // New method for filtering by price
};
