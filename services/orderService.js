const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const User = require('../models/User');

// Create an order from the user's cart
const createOrder = async (userId) => {
    try {
        // Get the user's cart
        const cart = await Cart.findOne({ userId }).populate('items.product');
        
        if (!cart || cart.items.length === 0) {
            throw new Error('Cart is empty');
        }

        // Calculate the total amount of the order (sum of the product prices * quantity)
        let totalAmount = 0;
        cart.items.forEach(item => {
            totalAmount += item.product.price * item.quantity;
        });

        // Create a new order document
        const order = new Order({
            userId,
            items: cart.items,
            totalAmount,
            paymentStatus: 'pending', // Set initial payment status
            status: 'pending', // Order status (e.g., pending, shipped)
        });

        // Save the order
        await order.save();

        // Optionally, you can clear the cart after placing the order
        cart.items = [];
        await cart.save();

        return order;
    } catch (err) {
        throw new Error('Error creating order: ' + err.message);
    }
};

// Get all orders for a user
const getUserOrders = async (userId) => {
    try {
        // Find all orders for the user
        const orders = await Order.find({ userId }).populate('items.product');
        return orders;
    } catch (err) {
        throw new Error('Error fetching user orders: ' + err.message);
    }
};

// Get a specific order by ID
const getOrderById = async (orderId) => {
    try {
        // Find the order by ID
        const order = await Order.findById(orderId).populate('items.product');
        
        if (!order) {
            throw new Error('Order not found');
        }

        return order;
    } catch (err) {
        throw new Error('Error fetching order: ' + err.message);
    }
};

// Update the status of an order (e.g., from "pending" to "shipped")
const updateOrderStatus = async (orderId, status) => {
    try {
        // Find the order by ID and update its status
        const order = await Order.findById(orderId);

        if (!order) {
            throw new Error('Order not found');
        }

        order.status = status;
        await order.save();
        return order;
    } catch (err) {
        throw new Error('Error updating order status: ' + err.message);
    }
};

// Update the payment status of an order (e.g., from "pending" to "paid")
const updatePaymentStatus = async (orderId, paymentStatus) => {
    try {
        // Find the order by ID and update its payment status
        const order = await Order.findById(orderId);

        if (!order) {
            throw new Error('Order not found');
        }

        order.paymentStatus = paymentStatus;
        await order.save();
        return order;
    } catch (err) {
        throw new Error('Error updating payment status: ' + err.message);
    }
};

// Cancel an order
const cancelOrder = async (orderId) => {
    try {
        // Find the order by ID
        const order = await Order.findById(orderId);

        if (!order) {
            throw new Error('Order not found');
        }

        if (order.status === 'shipped') {
            throw new Error('Order has already been shipped, cannot cancel');
        }

        // Set the order status to 'canceled'
        order.status = 'canceled';
        await order.save();
        return order;
    } catch (err) {
        throw new Error('Error canceling order: ' + err.message);
    }
};

module.exports = {
    createOrder,
    getUserOrders,
    getOrderById,
    updateOrderStatus,
    updatePaymentStatus,
    cancelOrder,
};
