const { stripe } = require('../config/paymentConfig'); // Stripe instance from the paymentConfig file
const Order = require('../models/Order'); // Order model to link orders with payments
const { sendEmail } = require('../services/emailService'); // Assuming you have an email service to notify users

// Create a payment intent
const createPaymentIntent = async (req, res) => {
    try {
        const { orderId, amount } = req.body; // Order ID and amount to be charged (in cents)

        // Ensure the order exists
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if the amount matches the order total
        if (amount !== order.totalAmount) {
            return res.status(400).json({ message: 'Amount mismatch with order total' });
        }

        // Create a Stripe payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100, // Convert the amount to cents (Stripe expects the amount in cents)
            currency: 'usd', // You can change this to your desired currency
            metadata: { orderId: orderId },
        });

        // Send the client secret to the frontend to complete the payment
        res.status(200).json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error creating payment intent' });
    }
};

// Confirm the payment (after receiving the payment method from the frontend)
const confirmPayment = async (req, res) => {
    try {
        const { paymentIntentId, paymentMethodId } = req.body; // Payment intent ID and payment method ID

        // Confirm the payment with Stripe
        const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
            payment_method: paymentMethodId, // Payment method ID from the frontend
        });

        if (paymentIntent.status === 'succeeded') {
            // Find and update the order status to 'paid'
            const order = await Order.findOneAndUpdate(
                { _id: paymentIntent.metadata.orderId },
                { paymentStatus: 'paid', paymentIntentId: paymentIntent.id, orderStatus: 'processing' },
                { new: true }
            );

            // Send email notification to user
            const user = await order.populate('userId');
            sendEmail(user.email, 'Your order is confirmed', `Your order with ID: ${order._id} has been successfully paid and is now processing.`);

            res.status(200).json({ message: 'Payment confirmed and order updated', order });
        } else {
            res.status(400).json({ message: 'Payment failed' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error confirming payment' });
    }
};

// Handle payment success (used for webhook)
const handlePaymentSuccess = async (req, res) => {
    try {
        const { paymentIntentId } = req.body; // Payment intent ID from Stripe

        // Retrieve the payment intent from Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        const order = await Order.findById(paymentIntent.metadata.orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Update the order status to 'paid'
        order.paymentStatus = 'paid';
        order.paymentIntentId = paymentIntent.id;
        order.orderStatus = 'processing'; // Change to 'shipped' when applicable
        await order.save();

        // Send confirmation email to user
        const user = await order.populate('userId');
        sendEmail(user.email, 'Payment received and order is processing', `Your order with ID: ${order._id} has been successfully paid and is now processing.`);

        res.status(200).json({ message: 'Payment successful and order updated', order });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error handling payment success' });
    }
};

// Handle payment failure (optional, for example, to notify users of failed payments)
const handlePaymentFailure = (req, res) => {
    try {
        const { paymentIntentId } = req.body; // Payment intent ID from Stripe

        // Retrieve the payment intent from Stripe
        stripe.paymentIntents.retrieve(paymentIntentId).then(async (paymentIntent) => {
            if (!paymentIntent) {
                return res.status(404).json({ message: 'Payment intent not found' });
            }

            // Find the order associated with the payment and update its status
            const order = await Order.findById(paymentIntent.metadata.orderId);
            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }

            // Mark the order as failed
            order.paymentStatus = 'failed';
            await order.save();

            // Send failure email to user
            const user = await order.populate('userId');
            sendEmail(user.email, 'Payment failed', `Unfortunately, your payment for order ID: ${order._id} failed. Please try again.`);

            res.status(400).json({ message: 'Payment failed' });
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error handling payment failure' });
    }
};

module.exports = {
    createPaymentIntent,
    confirmPayment,
    handlePaymentSuccess,
    handlePaymentFailure,
};
