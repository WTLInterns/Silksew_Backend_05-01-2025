const Order = require('../models/Order'); // Order model to check if order exists and verify amount

// Middleware to check if the order exists and the payment amount is correct
const validatePayment = async (req, res, next) => {
    try {
        const { orderId, amount } = req.body; // Order ID and amount to charge (in cents)

        // Ensure the order exists
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if the amount matches the order's total amount
        if (amount !== order.totalAmount) {
            return res.status(400).json({ message: 'Amount mismatch with order total' });
        }

        // Proceed to the next middleware/controller if validation passes
        next();
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error validating payment' });
    }
};

module.exports = {
    validatePayment,
};
