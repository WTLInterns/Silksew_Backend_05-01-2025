// const Razorpay = require("razorpay");
// const crypto = require("crypto");
// const Payment = require("../models/Payment");

// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET
// });

// // Create order
// const createOrder = async (req, res) => {
//   try {
//     const options = {
//       amount: req.body.amount * 100, // in paise
//       currency: "INR",
//       receipt: `receipt_${Date.now()}`
//     };
//     const order = await razorpay.orders.create(options);
//     res.json(order);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Error creating order" });
//   }
// };

// // Verify payment controller
// const verifyPayment = async (req, res) => {
//   try {
//     const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

//     if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !amount) {
//       return res.status(400).json({ success: false, message: "Missing required payment details" });
//     }

//     // Step 1: Generate signature from order_id and payment_id
//     const body = `${razorpay_order_id}|${razorpay_payment_id}`;
//     const expectedSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//       .update(body)
//       .digest("hex");

//     // Step 2: Compare Razorpay's signature with our generated signature
//     if (expectedSignature === razorpay_signature) {
//       // Step 3: Store payment in DB
//       await Payment.create({
//         razorpay_order_id,
//         razorpay_payment_id,
//         razorpay_signature,
//         amount
//       });

//       return res.status(200).json({
//         success: true,
//         message: "Payment verified successfully"
//       });
//     } else {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid payment signature"
//       });
//     }
//   } catch (err) {
//     console.error("Payment verification error:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Server error during payment verification"
//     });
//   }
// };


// module.exports = { createOrder, verifyPayment };



const Razorpay = require("razorpay");
const crypto = require("crypto");
const Payment = require("../models/Payment");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST /api/payment/create-order
// Body: { amount: 1500 }  // INR (we’ll convert to paise)
exports.createOrder = async (req, res) => {
  try {
    const { amount } = req.body; // INR
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Amount is required" });
    }

    const options = {
      amount: Math.round(amount * 100), // convert to paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    // Return order object to frontend
    return res.json(order);
  } catch (err) {
    console.error("createOrder error:", err);
    res.status(500).json({ success: false, message: "Error creating order" });
  }
};

// POST /api/payment/verify
// Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount }
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing payment params" });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    // Save payment
    await Payment.create({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount, // store in INR for readability
      status: "captured",
    });

    return res.json({ success: true, message: "Payment verified successfully" });
  } catch (err) {
    console.error("verifyPayment error:", err);
    res.status(500).json({ success: false, message: "Verification failed" });
  }
};
