// paymentConfig.js

require('dotenv').config();

// Example for PayPal SDK setup (Using PayPal REST SDK)
const paypal = require('paypal-rest-sdk');

paypal.configure({
    mode: 'sandbox', // Or 'live' for production
    client_id: process.env.PAYPAL_CLIENT_ID,
    client_secret: process.env.PAYPAL_CLIENT_SECRET,
});

// Razorpay configuration
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const paymentConfig = {
    paypal,
    razorpay,
    // You can add other payment provider configurations here
};

module.exports = paymentConfig;
