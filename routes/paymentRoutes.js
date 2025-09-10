const express = require('express');
const router = express.Router();
const { stripePayment, razorpayPayment } = require('../controllers/paymentController');

router.post('/stripe', stripePayment);  // Stripe payment processing
router.post('/razorpay', razorpayPayment);  // Razorpay payment processing

module.exports = router;
