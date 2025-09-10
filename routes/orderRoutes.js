const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  createOrder,
  getOrderById,
  getMyOrders,
  getAllOrders,
  placeOrder,
  placeOrderStripe,
  placeOrderRazorpay,
  updateOrderStatus,
  updatePaymentStatus,
  returnProduct,
  getReturnOrder,
  saveReturnReason,
  // updateReturnStatus,
  updateReturnAction,
} = require("../controllers/orderController");

const router = express.Router();

// Create a new order (protected route)
router.post("/", createOrder);

// Get logged-in user's orders (protected route)
router.get("/myorders", protect, getMyOrders);

// Get all orders (admin-only route)
router.get("/", protect, getAllOrders);

// Payment Features
router.post("/place", protect, placeOrder);
router.post("/stripe", protect, placeOrderStripe);
router.post("/razorpay", protect, placeOrderRazorpay);

router.post("/order-status", updateOrderStatus);
router.post("/payment-status", updatePaymentStatus);

router.post("/send-confirmation-email", async (req, res) => {
  try {
    const { email, items, totalAmount } = req.body;

    // Validate required fields
    if (!email || !items || !totalAmount) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    // Send email
    await sendOrderConfirmationEmail(email, items, totalAmount);

    res.json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    console.error(" Error sending confirmation email:", error);
    res.status(500).json({ success: false, message: "Error sending email" });
  }
});

// return product router

// Request a return for a product
router.post("/request-return/:orderId/:productId", protect, returnProduct);

// Get all return orders
router.get("/return-orders", protect, getReturnOrder);

// Save return reason
router.post("/save-reason", protect, saveReturnReason);

router.post("/update-return-status/:_id/:productId", updateReturnAction);

module.exports = router;
