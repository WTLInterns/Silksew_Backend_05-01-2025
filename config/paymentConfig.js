// paymentConfig.js (For PayPal)

require('dotenv').config();

// Example for PayPal SDK setup (Using PayPal REST SDK)
const paypal = require('paypal-rest-sdk');

paypal.configure({
    mode: 'sandbox', // Or 'live' for production
    client_id: process.env.PAYPAL_CLIENT_ID,
    client_secret: process.env.PAYPAL_CLIENT_SECRET,
});

const paymentConfig = {
    paypal,
    // You can add other payment provider configurations here
};

module.exports = paymentConfig;
