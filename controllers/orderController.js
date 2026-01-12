const Order = require("../models/Order");
const Offer = require("../models/offer");
const Cart = require("../models/Cart");
require("dotenv").config(); // Load .env file
const User = require("../models/User");
const sendOrderConfirmationEmail = require("./mailer");
// const { getShiprocketToken } = require("../utils/shiprocketAuth");
const axios = require("axios");
const crypto = require("crypto"); // For payment verification
const { stripe, razorpay } = require('../config/paymentConfig'); // Payment instances
const { sendEmail } = require('../services/emailService'); // Email service


const currency = "inr";
const deliveryCharge = 10;

const createOrder = async (req, res) => {
  try {
    console.log("Request received:", req.body); // Log the incoming request body
    const { items, totalAmount, paymentMethod, address, paymentIntentId } =
      req.body;

    if (!items || !items.length || !totalAmount || !paymentMethod || !address) {
      return res
        .status(400)
        .json({ message: "Missing required fields in the order" });
    }

    const finalAmount = totalAmount + deliveryCharge;

    let paymentIntent;

    // Handle payment based on payment method
    if (paymentMethod === "card") {
      if (!paymentIntentId) {
        // Create a new payment intent if one is not provided
        paymentIntent = await stripe.paymentIntents.create({
          amount: finalAmount * 100, // Convert to smallest currency unit (e.g., paise for INR)
          currency,
          payment_method_types: ["card"],
        });
      } else {
        // Retrieve existing payment intent
        paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      }

      if (!paymentIntent) {
        return res
          .status(500)
          .json({ message: "Unable to process payment with Stripe" });
      }
    }

    const order = await Order.create({
      user: req.user.id,
      items,
      totalAmount: finalAmount,
      paymentMethod,
      paymentIntentId: paymentIntent ? paymentIntent.id : null,
      status: paymentMethod === "card" ? "Pending Payment" : "Processing",
      address,
    });

    res
      .status(201)
      .json({
        order,
        clientSecret: paymentIntent ? paymentIntent.client_secret : null,
        message: "Order created successfully",
      });
  } catch (error) {
    console.error("Error in createOrder:", error.message); // Log errors
    res.status(500).json({ message: error.message });
  }
};

// Other methods remain unchanged
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("items.product");
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.user.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Unauthorized access to the order" });
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    // Get all orders for this user, sorted by date (newest first)
    const orders = await Order.find({ userId })
      .populate("userId", "name email") // Populate user details
      .sort({ date: -1 }); // Sort by date descending (newest first)

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllOrders = async (req, res) => {
  try {
    // Get all orders (both COD and online payments)
    const orders = await Order.find({})
      .populate("userId", "name email") // Populate user details
      .populate({
        path: "items.productId", // Populate product details in items
        select: "name price images" // Include only necessary fields
      })
      .sort({ createdAt: -1 }); // Sort by newest first

    console.log("Fetched orders:", orders.length); // Log number of orders found
    console.log("Payment methods:", [...new Set(orders.map(o => o.paymentMethod))]); // Log payment methods found
    
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch orders",
      error: error.message 
    });
  }
};

const getShiprocketToken = async () => {
  const response = await axios.post(
    `${process.env.SHIPROCKET_BASE_URL}/auth/login`,
    {
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    }
  );
  console.log("✅ Shiprocket token generated successfully!");
  return response.data.token;
};









const placeOrder = async (req, res) => {
  try {
    console.log("=== COD PLACE ORDER DEBUG START ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    console.log("User from auth:", req.user);
    
    const { items, totalAmount, address, paymentMethod } = req.body;
    const userId = req.user?._id;

    console.log("Extracted data:", { 
      userId, 
      itemsCount: items?.length, 
      totalAmount, 
      paymentMethod,
      addressKeys: Object.keys(address || {}),
      hasPhone: !!address?.phone,
      phoneValue: address?.phone
    });

    if (!userId || !items?.length || !totalAmount || !address || !paymentMethod) {
      console.log("❌ Validation failed");
      return res.status(400).json({
        success: false,
        message: "All fields are required and items must be a non-empty array.",
      });
    }

    console.log("Looking up user...");
    const user = await User.findById(userId);
    if (!user) {
      console.log("❌ User not found");
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    console.log("✅ User found");

    // ===== Save order in MongoDB =====
    console.log("Creating order...");
    const newOrder = new Order({
      userId,
      items,
      totalAmount,
      address,
      paymentMethod,
      payment: false,
      date: new Date(),
    });
    
    console.log("Saving order to DB...");
    await newOrder.save();
    console.log("✅ Order saved:", newOrder._id.toString());
    console.log("✅ Order saved in MongoDB:", newOrder._id.toString());

    // ===== Shiprocket Integration =====
    console.log("Preparing Shiprocket data...");
    
    // Validate required fields for Shiprocket
    const pickupLocation = process.env.SHIPROCKET_PICKUP_LOCATION_NAME;
    const billingPhone = address.phone;
    const shippingPhone = address.phone;
    
    console.log("Shiprocket validation:", {
      pickupLocation,
      billingPhone,
      shippingPhone,
      billingPhoneType: typeof billingPhone,
      pickupLocationType: typeof pickupLocation
    });
    
    if (!pickupLocation) {
      console.log("❌ SHIPROCKET_PICKUP_LOCATION_NAME is not set in environment variables");
      // Continue without Shiprocket for now, but log the issue
    }
    
    if (!billingPhone || billingPhone === 'undefined' || billingPhone === 'null') {
      console.log("❌ Invalid phone number for Shiprocket");
      return res.status(400).json({
        success: false,
        message: "Valid phone number is required for order processing.",
      });
    }
    
    const shiprocketOrderData = {
      order_id: newOrder._id.toString(),
      order_date: new Date().toISOString().slice(0, 19).replace("T", " "),
      pickup_location: pickupLocation || "Default", // Fallback to prevent undefined
      comment: "Order from SilkSew app",
      billing_customer_name: address.firstName || "Customer",
      billing_last_name: address.lastName || "Name",
      billing_address: address.street || "Address",
      billing_address_2: "",
      billing_city: address.city || "City",
      billing_pincode: address.pincode || address.zipcode || "000000",
      billing_state: address.state || "State",
      billing_country: "India",
      billing_email: user.email || "customer@example.com",
      billing_phone: billingPhone ? `91${billingPhone}` : "910000000000", // Ensure proper format
      shipping_is_billing: true,
      shipping_customer_name: address.firstName || "Customer",
      shipping_last_name: address.lastName || "Name",
      shipping_address: address.street || "Address",
      shipping_address_2: "",
      shipping_city: address.city || "City",
      shipping_pincode: address.pincode || address.zipcode || "000000",
      shipping_state: address.state || "State",
      shipping_country: "India",
      shipping_email: user.email || "customer@example.com",
      shipping_phone: shippingPhone ? `91${shippingPhone}` : "910000000000", // Ensure proper format
      order_items: items.map((item) => ({
        name: item.productName || "Product",
        sku: item.productId || "SKU",
        units: item.quantity || 1,
        selling_price: item.price || 0,
        discount: 0,
        tax: 0,
      })),
      payment_method: (paymentMethod === "Cash on Delivery" || paymentMethod === "COD") ? "COD" : "Prepaid",
      sub_total: totalAmount || 0,
      length: 10,
      breadth: 10,
      height: 10,
      weight: 1.5,
    };

    console.log("Shiprocket data prepared:", JSON.stringify(shiprocketOrderData, null, 2));

    let shiprocketOrderId = null;
    try {
      console.log("Getting Shiprocket token...");
      const token = await getShiprocketToken();
      console.log("✅ Shiprocket token obtained");
      
      console.log("Creating Shiprocket order...");
      const shiprocketResponse = await axios.post(
        `${process.env.SHIPROCKET_BASE_URL}/orders/create/adhoc`,
        shiprocketOrderData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      
      shiprocketOrderId = shiprocketResponse.data.order_id;
      console.log("✅ Shiprocket order created:", shiprocketOrderId);
      
      // Update order with Shiprocket ID
      newOrder.shiprocketOrderId = shiprocketOrderId;
      await newOrder.save();
      console.log("✅ Order updated with Shiprocket ID");
      
    } catch (shiprocketError) {
      console.error("❌ Shiprocket integration failed:", shiprocketError.message);
      console.error("Shiprocket error details:", shiprocketError.response?.data || shiprocketError);
      // Continue without Shiprocket - order is still valid
    }

    console.log("📦 Final Order Response:", newOrder);
    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order: newOrder,
      userEmail: user.email,
      shiprocketOrderId: shiprocketOrderId,
    });

  } catch (error) {
    console.error("❌ ORDER PLACEMENT ERROR:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    // Handle specific MongoDB duplicate key error
    if (error.code === 11000) {
      console.error("❌ MongoDB duplicate key error:", error.keyValue);
      return res.status(400).json({
        success: false,
        message: "Duplicate entry detected. Please try again.",
        error: error.message,
      });
    }
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      console.error("❌ Mongoose validation error:", error.errors);
      return res.status(400).json({
        success: false,
        message: "Validation failed: " + Object.values(error.errors).map(e => e.message).join(', '),
        error: error.message,
      });
    }
    
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: error.message,
      });
    }
  }
};










const getTrackingData = async (req, res) => {
  try {
    const { orderId } = req.params; // Get orderId from URL params
    const { channelId } = req.query; // Optional channel ID from query params

    if (!orderId) {
      return res.status(400).json({ success: false, message: "orderId is required" });
    }

    // Find the order (works for both COD and online payments)
    const order = await Order.findById(orderId)
      .populate("userId", "name email")
      .populate({
        path: "items.productId",
        select: "name price images"
      });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Check if this is an online payment order with Shiprocket integration
    if (order.shiprocketOrderId) {
      try {
        const token = await getShiprocketToken();
        
        // Use the correct channel_id format for Shiprocket API
        const url = `https://apiv2.shiprocket.in/v1/external/courier/track?order_id=${order.shiprocketOrderId}${channelId ? `&channel_id=${channelId}` : ""}`;

        console.log(`Tracking URL: ${url}`);
        
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        return res.json({ 
          success: true, 
          data: response.data,
          isOnlinePayment: order.paymentMethod !== "Cash on Delivery"
        });
      } catch (shiprocketError) {
        console.error("Shiprocket tracking error:", shiprocketError.message);
        return res.status(500).json({ 
          success: false, 
          message: "Failed to fetch tracking data",
          error: shiprocketError.message 
        });
      }
    } else {
      // For COD orders or orders without Shiprocket integration
      return res.json({ 
        success: true, 
        message: "Order tracking information",
        order: order,
        isOnlinePayment: order.paymentMethod !== "Cash on Delivery"
      });
    }
  } catch (err) {
    console.error("Tracking error:", err);
    return res.status(500).json({ 
      success: false, 
      message: err.response?.data || err.message 
    });
  }
};



const userOrders = async (req, res) => {
  try {
    const { userId } = req.body;

    const orders = await Order.find({ userId });
    res.json({ success: true, orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const placeOrderStripe = async (req, res) => {
  res.status(501).json({ message: "Stripe payment not implemented yet" });
};

const placeOrderRazorpay = async (req, res) => {
  try {
    const { items, totalAmount, address, paymentMethod, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    const userId = req.user?._id;

    if (!userId || !items?.length || !totalAmount || !address || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "All fields are required and items must be a non-empty array.",
      });
    }

    // Verify Razorpay signature if provided
    if (razorpay_order_id && razorpay_payment_id && razorpay_signature) {
      const body = `${razorpay_order_id}|${razorpay_payment_id}`;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid payment signature" 
        });
      }
    }

    const user = await User.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    // ===== Save order in MongoDB =====
    const newOrder = new Order({
      userId,
      items,
      totalAmount,
      address,
      paymentMethod,
      payment: true, // Payment is successful for Razorpay
      razorpay_payment_id,
      razorpay_order_id,
      date: new Date(),
    });
    await newOrder.save();
    console.log("✅ Razorpay Order saved in MongoDB:", newOrder._id.toString());

    // ===== Shiprocket Integration =====
    const shiprocketOrderData = {
      order_id: newOrder._id.toString(),
      order_date: new Date().toISOString().slice(0, 19).replace("T", " "),
      pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION_NAME,
      comment: "Order from SilkSew app (Razorpay)",
      billing_customer_name: address.firstName,
      billing_last_name: address.lastName,
      billing_address: address.street,
      billing_address_2: "",
      billing_city: address.city,
      billing_pincode: address.pincode,
      billing_state: address.state,
      billing_country: "India",
      billing_email: user.email,
      billing_phone: "91" + address.phone,
      shipping_is_billing: true,
      shipping_customer_name: address.firstName,
      shipping_last_name: address.lastName,
      shipping_address: address.street,
      shipping_address_2: "",
      shipping_city: address.city,
      shipping_pincode: address.pincode,
      shipping_state: address.state,
      shipping_country: "India",
      shipping_email: user.email,
      shipping_phone: "91" + address.phone,
      order_items: items.map((item) => ({
        name: item.productName,
        sku: item.productId,
        units: item.quantity,
        selling_price: item.price,
        discount: 0,
        tax: 0,
      })),
      payment_method: "Prepaid", // Razorpay is always prepaid
      sub_total: totalAmount,
      length: 10,
      breadth: 10,
      height: 10,
      weight: 1.5,
    };

    try {
      const token = await getShiprocketToken();
      const shiprocketResponse = await axios.post(
        `${process.env.SHIPROCKET_BASE_URL}/orders/create/adhoc`,
        shiprocketOrderData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("📦 Shiprocket Response Data:", shiprocketResponse.data);

      if (shiprocketResponse.data?.order_id) {
        newOrder.shiprocketOrderId = shiprocketResponse.data.order_id;
        await newOrder.save();
        console.log(
          "✅ Shiprocket order created:",
          shiprocketResponse.data.order_id
        );
      } else {
        console.error(
          "❌ Shiprocket order was NOT created. Check pickup_location or fields."
        );
      }
    } catch (shiprocketError) {
      console.error("Shiprocket integration error:", shiprocketError.message);
      // Continue even if Shiprocket fails
    }

    // Send confirmation email
    try {
      await sendOrderConfirmationEmail(user.email, items, totalAmount);
      console.log("📧 Confirmation email sent");
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError.message);
    }

    res.status(201).json({
      success: true,
      message: "Razorpay order placed successfully",
      order: newOrder,
    });
  } catch (error) {
    console.error("Error placing Razorpay order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to place Razorpay order",
      error: error.message,
    });
  }
};

// Create Razorpay order (for payment popup)
const createRazorpayOrder = async (req, res) => {
  try {
    console.log("=== RAZORPAY ORDER CREATION DEBUG ===");
    console.log("Request body:", req.body);
    console.log("Using Razorpay Key ID:", process.env.RAZORPAY_KEY_ID?.substring(0, 10) + "...");
    
    const { amount } = req.body; // INR
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Amount is required" });
    }

    const options = {
      amount: Math.round(amount * 100), // convert to paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    console.log("Creating Razorpay order with options:", options);

    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    console.log("Razorpay instance created, attempting to create order...");
    const order = await razorpay.orders.create(options);
    console.log("✅ Razorpay order created:", order.id);
    
    return res.json(order);
  } catch (err) {
    console.error("❌ createOrder error:", err);
    console.error("Error details:", {
      message: err.message,
      code: err.code,
      statusCode: err.statusCode,
      description: err.description
    });
    
    // Specific error handling for common live mode issues
    if (err.code === 'BAD_REQUEST_ERROR') {
      return res.status(400).json({ 
        success: false, 
        message: "Live mode configuration error. Check domain whitelisting and account activation.",
        error: err.message 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Error creating Razorpay order: " + err.message,
      debug: {
        code: err.code,
        statusCode: err.statusCode
      }
    });
  }
};

// Verify Razorpay payment and create order
const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, items, address, totalAmount } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing payment params" });
    }

    // Verify signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Create order in orders collection
    const newOrder = new Order({
      userId,
      items: items || [],
      totalAmount: totalAmount || amount,
      address: address || {
        firstName: user.name?.split(' ')[0] || "User",
        lastName: user.name?.split(' ')[1] || "",
        email: user.email,
        phone: "0000000000",
        street: "Not specified",
        city: "Not specified", 
        state: "Not specified",
        zipcode: "000000",
        country: "India"
      },
      paymentMethod: "Razorpay",
      payment: true,
      razorpay_payment_id,
      razorpay_order_id,
      date: new Date(),
    });

    await newOrder.save();
    console.log("✅ Razorpay Order saved in MongoDB:", newOrder._id.toString());

    res.status(201).json({
      success: true,
      message: "Payment verified and order created successfully",
      order: newOrder,
    });
  } catch (error) {
    console.error("verifyRazorpayPayment error:", error);
    res.status(500).json({ success: false, message: "Verification failed" });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { _id, status, tentativeDeliveryDate } = req.body;

    // Prepare the update object
    const updateData = { status };

    // Only add tentativeDeliveryDate to the update if it's provided
    if (tentativeDeliveryDate) {
      updateData.tentativeDeliveryDate = new Date(tentativeDeliveryDate);
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      _id,
      updateData,
      { new: true } // This option returns the updated document
    );

    if (!updatedOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    res.json({ success: true, message: "Order Updated", order: updatedOrder });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updatePaymentStatus = async (req, res) => {
  try {
    const { _id, payment } = req.body;

    await Order.findByIdAndUpdate(_id, { payment });
    res.json({ success: true, message: "Status Updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// return order ----------
const updateReturnAction = async (req, res) => {
  try {
    const { _id, productId } = req.params; // Extract order ID and product ID from URL params
    console.log("Order ID:----------->", _id);
    console.log("Product ID:", productId);
    const { action } = req.body; // Extract action from request body

    if (!action) {
      return res
        .status(400)
        .json({ success: false, message: "Action is required" });
    }
    const specifyStatus = action === "accepted" ? true : false;

    const order = await Order.findOneAndUpdate(
      { _id, "items.productId": productId }, // Find the order and specific product
      {
        $set: {
          "items.$.action": action,
          "items.$.returnApproved": specifyStatus,
        },
      }, // Update only the specific product's action
      { new: true }
    );

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order or Product not found" });
    }

    res.json({ success: true, message: "Action Updated", order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const returnProduct = async (req, res) => {
  try {
    const { orderId, productId } = req.params;

    // Ensure order exists first
    const order = await Order.findById(orderId).select('_id items.productId items.returnRequested');
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const item = order.items.find((i) => i.productId.toString() === productId);
    if (!item) {
      return res.status(404).json({ message: "Product not found in order" });
    }
    if (item.returnRequested) {
      return res.status(400).json({ message: "Return already requested for this product" });
    }

    // Perform a targeted update to avoid validating unrelated legacy fields
    const updated = await Order.findOneAndUpdate(
      { _id: orderId, "items.productId": productId },
      { $set: { "items.$.returnRequested": true } },
      { new: true, runValidators: false }
    );

    if (!updated) {
      return res.status(404).json({ message: "Order or Product not found" });
    }

    res.status(200).json({ message: "Return request submitted successfully" });
  } catch (error) {
    console.error('Error in returnProduct:', error);
    res.status(500).json({ message: error.message });
  }
};

const saveReturnReason = async (req, res) => {
  try {
    const { orderId, productId, reason } = req.body;

    if (!orderId || !productId || !reason) {
      return res.status(400).json({ message: "OrderId, ProductId, and Reason are required" });
    }

    const updated = await Order.findOneAndUpdate(
      { _id: orderId, "items.productId": productId },
      {
        $set: {
          "items.$.returnReason": reason,
          "items.$.returnRequested": true,
        },
      },
      { new: true, runValidators: false }
    );

    if (!updated) {
      return res.status(404).json({ message: "Order or Product not found" });
    }

    res.status(200).json({ message: "Return reason saved successfully", data: updated });
  } catch (error) {
    res.status(500).json({ message: "Error saving return reason", error: error.message });
  }
};


const getReturnOrder = async (req, res) => {
  try {
    // Fetch orders where returnRequested is true in items
    const orders = await Order.find({ "items.returnRequested": true })
      .populate("userId", "firstName lastName email")
    // .populate("items.productId", "name")

    console.log("order id---", orders)
    // If no orders found
    if (!orders.length) {
      return res.status(404).json({ message: "No return requests found" })
    }

    // Format the fetched orders
    const formattedOrders = orders.flatMap((order) =>
      order.items
        .filter((item) => item.returnRequested)
        .map((returnItem) => {
          const productName = returnItem.productId ? returnItem.productId.name : "Unknown Product"

          return {
            _id: order._id,
            productName: productName,
            productId: returnItem.productId ? returnItem.productId._id : null,
            firstName: order.userId ? order.userId.firstName : "Unknown",
            lastName: order.userId ? order.userId.lastName : "Unknown",
            email: order.userId ? order.userId.email : "Unknown",
            street: order.address ? order.address.street : "Unknown",
            landmark: order.address ? order.address.landmark : "Unknown",
            city: order.address ? order.address.city : "Unknown",
            zipcode: order.address ? order.address.zipcode : "Unknown",
            country: order.address ? order.address.country : "Unknown",
            state: order.address ? order.address.state : "Unknown",
            phone: order.address ? order.address.phone : "Unknown",
            totalAmount: order.totalAmount,
            paymentMethod: order.paymentMethod,
            returnReason: returnItem.returnReason || "N/A",
            status: returnItem.returnApproved ? "Return Approved" : "Return Requested",
          }
        }),
    )

    res.status(200).json(formattedOrders)
  } catch (error) {
    console.error("Error in getReturnOrder:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

const updateReturnStatus = async (req, res) => {
  try {
    const { orderId, productId } = req.params;
    const { action } = req.body;

    console.log("Received orderId:", orderId);
    console.log("Received productId:", productId);
    console.log("Received action:", action);

    // Check if orderId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid orderId format" });
    }

    // Find the order by orderId
    const order = await Order.findById(orderId);
    console.log("Order fetched:", order);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Find the specific product in the order's items array
    const itemIndex = order.items.findIndex(
      (item) => item.productId.toString() === productId
    );
    console.log("🔹 Item index:", itemIndex);

    if (itemIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found in order" });
    }

    // Update the action field
    order.items[itemIndex].action = action;

    // Save the updated order
    await order.save();

    res
      .status(200)
      .json({ success: true, message: "Action updated successfully", order });
  } catch (error) {
    console.error(" Error updating return status:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a payment intent
const createPaymentIntent = async (req, res) => {
    try {
        const { orderId, amount } = req.body; // Order ID and amount to be charged (in cents)

        // Ensure order exists
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if amount matches order total
        if (amount !== order.totalAmount) {
            return res.status(400).json({ message: 'Amount mismatch with order total' });
        }

        // Create a Stripe payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100, // Convert amount to cents (Stripe expects amount in cents)
            currency: 'usd', // You can change this to your desired currency
            metadata: { orderId: orderId },
        });

        // Send client secret to frontend to complete payment
        res.status(200).json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error creating payment intent' });
    }
};

// Confirm payment (after receiving payment method from frontend)
const confirmPayment = async (req, res) => {
    try {
        const { paymentIntentId, paymentMethodId } = req.body; // Payment intent ID and payment method ID

        // Confirm payment with Stripe
        const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
            payment_method: paymentMethodId, // Payment method ID from frontend
        });

        if (paymentIntent.status === 'succeeded') {
            // Find and update order status to 'paid'
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

        // Retrieve payment intent from Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        const order = await Order.findById(paymentIntent.metadata.orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Update order status to 'paid'
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

        // Retrieve payment intent from Stripe
        stripe.paymentIntents.retrieve(paymentIntentId).then(async (paymentIntent) => {
            if (!paymentIntent) {
                return res.status(404).json({ message: 'Payment intent not found' });
            }

            // Find the order associated with the payment and update its status
            const order = await Order.findById(paymentIntent.metadata.orderId);
            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }

            // Mark order as failed
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

// Razorpay payment processing (original)
const razorpayPayment = async (req, res) => {
    try {
        const { amount, currency = 'INR', receipt, notes } = req.body;

        // Create Razorpay order
        const options = {
            amount: amount * 100, // Amount in paise (1 INR = 100 paise)
            currency,
            receipt,
            notes,
        };

        const razorpayOrder = await razorpay.orders.create(options);

        res.status(200).json({
            success: true,
            order: razorpayOrder,
        });
    } catch (error) {
        console.error('Razorpay order creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create Razorpay order',
            error: error.message,
        });
    }
};

// Update order process (Packed, Shipped, Delivered)
const updateOrderProcess = async (req, res) => {
  try {
    const { _id, orderProcess } = req.body;
    
    if (!_id || !orderProcess) {
      return res.status(400).json({ 
        success: false, 
        message: "Order ID and process status are required" 
      });
    }

    // Auto-update status based on process
    let status = "Pending";
    if (orderProcess === "Delivered") {
      status = "Confirmed"; // Only delivered orders are confirmed
    } else if (orderProcess === "Shipped") {
      status = "Pending"; // Still pending until delivered
    } else if (orderProcess === "Packed") {
      status = "Pending"; // Still pending until delivered
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      _id, 
      { 
        orderProcess,
        status,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!updatedOrder) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }

    res.json({ 
      success: true, 
      message: "Order process updated successfully",
      order: updatedOrder
    });
  } catch (error) {
    console.error("Error updating order process:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update order process",
      error: error.message 
    });
  }
};

module.exports = {
  createOrder,
  getOrderById,
  getMyOrders,
  getAllOrders,
  placeOrder,
  placeOrderStripe,
  placeOrderRazorpay,
  updatePaymentStatus,
  updateOrderStatus,
  userOrders,
  updateReturnAction,
  returnProduct,
  saveReturnReason,
  getReturnOrder,
  updateReturnStatus,
  getTrackingData,
  createRazorpayOrder,
  verifyRazorpayPayment,
  // Merged payment functions
  createPaymentIntent,
  confirmPayment,
  handlePaymentSuccess,
  handlePaymentFailure,
  razorpayPayment,
  // Order process function
  updateOrderProcess
};
