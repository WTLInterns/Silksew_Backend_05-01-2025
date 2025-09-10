const Order = require('../models/Order');
const { processPayment, processRefund } = require('../utils/paymentGateway');  // Import the methods from paymentGateway

// Process the payment for an order
const processOrderPayment = async (orderId, paymentDetails) => {
    try {
        // Find the order by ID
        const order = await Order.findById(orderId);

        if (!order) {
            throw new Error('Order not found');
        }

        // Check if the order is already paid
        if (order.paymentStatus === 'paid') {
            throw new Error('Order already paid');
        }

        // Process the payment using the payment gateway (e.g., Stripe, PayPal)
        const paymentResponse = await processPayment(paymentDetails);

        if (!paymentResponse.success) {
            throw new Error('Payment failed: ' + paymentResponse.error);
        }

        // Update the order's payment status to 'paid'
        order.paymentStatus = 'paid';
        order.transactionId = paymentResponse.transactionId;  // Store the transaction ID
        await order.save();

        // Optionally, notify the user about the successful payment (via email, etc.)
        // Example: sendEmailConfirmation(order.userId, order);

        return order;
    } catch (err) {
        throw new Error('Error processing payment: ' + err.message);
    }
};

// Refund a payment for an order
const refundOrderPayment = async (orderId) => {
    try {
        // Find the order by ID
        const order = await Order.findById(orderId);

        if (!order) {
            throw new Error('Order not found');
        }

        // Check if the order is already refunded
        if (order.paymentStatus === 'refunded') {
            throw new Error('Order already refunded');
        }

        // Process the refund using the payment gateway
        const refundResponse = await processRefund(order);

        if (!refundResponse.success) {
            throw new Error('Refund failed: ' + refundResponse.error);
        }

        // Update the order's payment status to 'refunded'
        order.paymentStatus = 'refunded';
        order.refundId = refundResponse.refundId;  // Store the refund ID
        await order.save();

        return order;
    } catch (err) {
        throw new Error('Error processing refund: ' + err.message);
    }
};

module.exports = {
    processOrderPayment,
    refundOrderPayment,
};
