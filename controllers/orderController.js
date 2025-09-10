const Order = require("../models/Order");
const Offer = require("../models/offer");
const Cart = require("../models/Cart");
require("dotenv").config(); // Load .env file
const User = require("../models/User");
const sendOrderConfirmationEmail = require("./mailer");

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
    const orders = await Order.find({ userId: req.user._id });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate("userId", "name email"); // Populate userId to get name and email
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// const placeOrder = async (req, res) => {
//   try {
//     const { items, totalAmount, address, paymentMethod } = req.body;
//     const userId = req.user?._id;

//     // Validate required fields
//     if (
//       !userId ||
//       !items ||
//       !Array.isArray(items) ||
//       items.length === 0 ||
//       !totalAmount ||
//       !address ||
//       !paymentMethod
//     ) {
//       return res
//         .status(400)
//         .json({
//           success: false,
//           message:
//             "All fields are required and items must be a non-empty array.",
//         });
//     }

//     // Fetch user details
//     const user = await User.findById(userId);
//     if (!user) {
//       return res
//         .status(404)
//         .json({ success: false, message: "User not found" });
//     }

//     // Create a new order
//     const newOrder = new Order({
//       userId,
//       items,
//       totalAmount,
//       address,
//       paymentMethod,
//       payment: false,
//       date: new Date(),
//     });

//     // Save order to database
//     await newOrder.save();

//     // Send confirmation email with corrected item properties
//     await sendOrderConfirmationEmail(
//       user.email,
//       items.map((item) => ({
//         name: item.productName,
//         quantity: item.quantity,
//         price: item.price,
//       })),
//       totalAmount,
//       address // Add this line
//     );

//     res.status(201).json({
//       success: true,
//       message: "Order placed successfully",
//       order: newOrder,
//       userEmail: user.email, // Ensure frontend gets the email
//     });
//   } catch (error) {
//     console.error(" Order placement error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//       error: error.message,
//     });
//   }
// };


const placeOrder = async (req, res) => {
  try {
    const { items, totalAmount, address, paymentMethod, offerCode } = req.body;
    const userId = req.user?._id;

    if (
      !userId ||
      !items ||
      !Array.isArray(items) ||
      items.length === 0 ||
      !totalAmount ||
      !address ||
      !paymentMethod
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required and items must be a non-empty array.",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Apply offer if offerCode is provided
    let discountAmount = 0;
    let finalAmount = totalAmount;
    if (offerCode) {
      const offer = await Offer.findOne({ code: offerCode });

      if (
        offer &&
        offer.active &&
        offer.startDate <= new Date() &&
        offer.endDate >= new Date()
      ) {
        if (offer.offerType === "percentage") {
          discountAmount = (totalAmount * offer.value) / 100;
        } else if (offer.offerType === "flat") {
          discountAmount = offer.value;
        }

        finalAmount = totalAmount - discountAmount;

        // Optional: Save the last used discount
        offer.lastUsedAmount = finalAmount;
        await offer.save();
        console.log("offer",offer)
      } else {
        return res.status(400).json({ success: false, message: "Invalid or expired offer code" });
      }
    }

    // Create a new order
    const newOrder = new Order({
      userId,
      items,
      totalAmount: finalAmount,
      address,
      paymentMethod,
      discountAmount,
      payment: false,
      date: new Date(),
      offerCode: offerCode || null, // save offerCode for record if any
    });

    await newOrder.save();

    await sendOrderConfirmationEmail(
      user.email,
      items.map((item) => ({
        name: item.productName,
        quantity: item.quantity,
        price: item.price,
      })),
      finalAmount,
      address
    );

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order: newOrder,
      discountAmount,
      userEmail: user.email,
    });
  } catch (error) {
    console.error("Order placement error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
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
  res.status(501).json({ message: "Razorpay payment not implemented yet" });
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

    const order = await Order.findOne({ _id: orderId });
    console.log(orderId);
    console.log(productId);
    console.log(req.user._id.toString());

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const itemIndex = order.items.findIndex(
      (item) => item.productId.toString() === productId
    );
    if (itemIndex === -1) {
      return res.status(404).json({ message: "Product not found in order" });
    }

    const item = order.items[itemIndex];
    if (item.returnRequested) {
      return res
        .status(400)
        .json({ message: "Return already requested for this product" });
    }

    item.returnRequested = true;
    await order.save();

    res.status(200).json({ message: "Return request submitted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const saveReturnReason = async (req, res) => {
  try {
    const { orderId, productId, reason } = req.body;

    if (!orderId || !productId || !reason) {
      return res
        .status(400)
        .json({ message: "OrderId, ProductId, and Reason are required" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const item = order.items.find(
      (item) => item.productId.toString() === productId
    );
    if (!item) {
      return res
        .status(404)
        .json({ message: "Product not found in the order" });
    }

    item.returnReason = reason;
    item.returnRequested = true;

    await order.save();

    res
      .status(200)
      .json({ message: "Return reason saved successfully", data: order });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error saving return reason", error: error.message });
  }
};

// const getReturnOrder = async (req, res) => {
//   try {
//     // Fetch orders where returnRequested is true in items
//     const orders = await Order.find({ "items.returnRequested": true })
//       .populate("userId", "firstName lastName email") // Populating userId with firstName, lastName, and email
//       .populate("items.productId", "name"); // Populating productId with name
//     console.log("orders", orders);

//     // If no orders found
//     if (!orders.length) {
//       return res.status(404).json({ message: "No return requests found" });
//     }

//     // Format the fetched orders
//     const formattedOrders = orders.flatMap((order) =>
//       order.items
//         .filter((item) => item.returnRequested)
//         .map((returnItem) => {
//           const productName = returnItem.productId
//             ? returnItem.productId.name
//             : "Unknown Product";

//           return {
//             _id: order._id,
//             productName: productName,
//             productId: returnItem.productId._id,
//             firstName: order.userId ? order.userId.firstName : "Unknown", // Accessing firstName from populated userId
//             lastName: order.userId ? order.userId.lastName : "Unknown", // Accessing lastName from populated userId
//             email: order.userId ? order.userId.email : "Unknown", // Accessing email from populated userId
//             street: order.address ? order.address.street : "Unknown",
//             landmark: order.address ? order.address.landmark : "Unknown",
//             city: order.address ? order.address.city : "Unknown",
//             zipcode: order.address ? order.address.zipcode : "Unknown",
//             country: order.address ? order.address.country : "Unknown",
//             state: order.address ? order.address.state : "Unknown",
//             phone: order.address ? order.address.phone : "Unknown",
//             totalAmount: order.totalAmount,
//             paymentMethod: order.paymentMethod,
//             returnReason: returnItem.returnReason || "N/A",
//             status: returnItem.returnApproved
//               ? "Return Approved"
//               : "Return Requested",
//           };
//         })
//     );

//     res.status(200).json(formattedOrders);
//   } catch (error) {
//     console.error("Error in getReturnOrder:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };


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
};
