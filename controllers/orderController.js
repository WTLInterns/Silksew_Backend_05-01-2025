const Order = require("../models/Order");
const Offer = require("../models/offer");
const Cart = require("../models/Cart");
require("dotenv").config(); // Load .env file
const User = require("../models/User");
const sendOrderConfirmationEmail = require("./mailer");
// const { getShiprocketToken } = require("../utils/shiprocketAuth");
const axios = require("axios");


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
    const orders = await Order.find({})
      .populate("userId", "name email") // Populate user details
      .populate({
        path: "items.productId", // Populate product details in items
        select: "name price images" // Include only necessary fields
      })
      .sort({ createdAt: -1 }); // Sort by newest first

    console.log("Fetched orders:", orders.length); // Log number of orders found
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


// const placeOrder = async (req, res) => {
//   try {
//     const { items, totalAmount, address, paymentMethod, offerCode } = req.body;
//     const userId = req.user?._id;

//     if (
//       !userId ||
//       !items ||
//       !Array.isArray(items) ||
//       items.length === 0 ||
//       !totalAmount ||
//       !address ||
//       !paymentMethod
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "All fields are required and items must be a non-empty array.",
//       });
//     }

//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ success: false, message: "User not found" });
//     }

//     // Apply offer if offerCode is provided
//     let discountAmount = 0;
//     let finalAmount = totalAmount;
//     if (offerCode) {
//       const offer = await Offer.findOne({ code: offerCode });

//       if (
//         offer &&
//         offer.active &&
//         offer.startDate <= new Date() &&
//         offer.endDate >= new Date()
//       ) {
//         if (offer.offerType === "percentage") {
//           discountAmount = (totalAmount * offer.value) / 100;
//         } else if (offer.offerType === "flat") {
//           discountAmount = offer.value;
//         }

//         finalAmount = totalAmount - discountAmount;

//         // Optional: Save the last used discount
//         offer.lastUsedAmount = finalAmount;
//         await offer.save();
//         console.log("offer",offer)
//       } else {
//         return res.status(400).json({ success: false, message: "Invalid or expired offer code" });
//       }
//     }

//     // Create a new order
//     const newOrder = new Order({
//       userId,
//       items,
//       totalAmount: finalAmount,
//       address,
//       paymentMethod,
//       discountAmount,
//       payment: false,
//       date: new Date(),
//       offerCode: offerCode || null, // save offerCode for record if any
//     });

//     await newOrder.save();

//     await sendOrderConfirmationEmail(
//       user.email,
//       items.map((item) => ({
//         name: item.productName,
//         quantity: item.quantity,
//         price: item.price,
//       })),
//       finalAmount,
//       address
//     );

//     res.status(201).json({
//       success: true,
//       message: "Order placed successfully",
//       order: newOrder,
//       discountAmount,
//       userEmail: user.email,
//     });
//   } catch (error) {
//     console.error("Order placement error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//       error: error.message,
//     });
//   }
// };

// const placeOrder = async (req, res) => {
//   try {
//     const { items, totalAmount, address, paymentMethod, offerCode } = req.body;
//     const userId = req.user?._id;

//     if (
//       !userId ||
//       !items ||
//       !Array.isArray(items) ||
//       items.length === 0 ||
//       !totalAmount ||
//       !address ||
//       !paymentMethod
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "All fields are required and items must be a non-empty array.",
//       });
//     }

//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ success: false, message: "User not found" });
//     }

//     // Apply offer if offerCode is provided
//     let discountAmount = 0;
//     let finalAmount = totalAmount;
//     if (offerCode) {
//       const offer = await Offer.findOne({ code: offerCode });

//       if (
//         offer &&
//         offer.active &&
//         offer.startDate <= new Date() &&
//         offer.endDate >= new Date()
//       ) {
//         if (offer.offerType === "percentage") {
//           discountAmount = (totalAmount * offer.value) / 100;
//         } else if (offer.offerType === "flat") {
//           discountAmount = offer.value;
//         }

//         finalAmount = totalAmount - discountAmount;
//         offer.lastUsedAmount = finalAmount;
//         await offer.save();
//       } else {
//         return res.status(400).json({ success: false, message: "Invalid or expired offer code" });
//       }
//     }

//     // Create a new order
//     const newOrder = new Order({
//       userId,
//       items,
//       totalAmount: finalAmount,
//       address,
//       paymentMethod,
//       discountAmount,
//       payment: false,
//       date: new Date(),
//       offerCode: offerCode || null,
//     });

//     await newOrder.save();

//     // Send order confirmation email (existing logic)
//     await sendOrderConfirmationEmail(
//       user.email,
//       items.map((item) => ({
//         name: item.productName,
//         quantity: item.quantity,
//         price: item.price,
//       })),
//       finalAmount,
//       address
//     );

//     // ===== Shiprocket Integration =====
//     try {
//       const token = await getShiprocketToken(); 

//       const shiprocketOrderData = {
//         order_id: newOrder._id.toString(),
//         order_date: new Date().toISOString(),
//         pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION_ID,
//         billing_customer_name: address.firstName + " " + address.lastName,
//         billing_email: user.email,
//         billing_phone: address.phone,
//         billing_address: address.street,
//         billing_city: address.city,
//         billing_state: address.state,
//         billing_postcode: address.pincode,
//         shipping_is_billing: true,
//         order_items: items.map((item) => ({
//           name: item.productName,
//           sku: item.productId,
//           units: item.quantity,
//           selling_price: item.price,
//           discount: 0,
//           tax: 0,
//         })),
//       };

//       await axios.post(
//         "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc",
//         shiprocketOrderData,
//         {
//           headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
//         }
//       );

//       console.log("✅ Shiprocket order created");
//     } catch (err) {
//       console.error("❌ Shiprocket order creation failed:", err.response?.data || err.message);
//     }
//     // ===== End Shiprocket Integration =====

//     res.status(201).json({
//       success: true,
//       message: "Order placed successfully",
//       order: newOrder,
//       discountAmount,
//       userEmail: user.email,
//     });
//   } catch (error) {
//     console.error("Order placement error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//       error: error.message,
//     });
//   }
// };

/////////////////////////////////////////////////////////////////////////////////////

// const placeOrder = async (req, res) => {
//   try {
//     const { items, totalAmount, address, paymentMethod, offerCode } = req.body;
//     const userId = req.user?._id;

//     if (!userId || !items?.length || !totalAmount || !address || !paymentMethod) {
//       return res.status(400).json({
//         success: false,
//         message: "All fields are required and items must be a non-empty array.",
//       });
//     }

//     const user = await User.findById(userId);
//     if (!user) return res.status(404).json({ success: false, message: "User not found" });

//     // ===== Offer logic =====
//     let discountAmount = 0;
//     let finalAmount = totalAmount;
//     if (offerCode) {
//       const offer = await Offer.findOne({ code: offerCode });
//       if (offer && offer.active && offer.startDate <= new Date() && offer.endDate >= new Date()) {
//         discountAmount = offer.offerType === "percentage" ? (totalAmount * offer.value) / 100 : offer.value;
//         finalAmount = totalAmount - discountAmount;
//         offer.lastUsedAmount = finalAmount;
//         await offer.save();
//       } else return res.status(400).json({ success: false, message: "Invalid or expired offer code" });
//     }

//     // ===== Save order in MongoDB =====
//     const newOrder = new Order({
//       userId,
//       items,
//       totalAmount: finalAmount,
//       address,
//       paymentMethod,
//       discountAmount,
//       payment: false,
//       date: new Date(),
//       offerCode: offerCode || null,
//     });
//     await newOrder.save();
//     console.log("✅ Order saved in MongoDB:", newOrder._id.toString());

//     // ===== Send order confirmation email =====
//     await sendOrderConfirmationEmail(
//       user.email,
//       items.map(item => ({
//         name: item.productName,
//         quantity: item.quantity,
//         price: item.price,
//       })),
//       finalAmount,
//       address
//     );
//     console.log("✅ Order confirmation email sent to user:", user.email);

//     // ===== Shiprocket Integration =====
//     const shiprocketOrderData = {
//       order_id: newOrder._id.toString(),
//       order_date: new Date().toISOString().slice(0, 19).replace("T", " "), // YYYY-MM-DD HH:mm:ss
//       pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION_ID,//👈 name (not ID)
//       channel_id: "", // optional
//       comment: "Order created from SilkSew app",
//       billing_customer_name: address.firstName,
//       billing_last_name: address.lastName,
//       billing_address: address.street,
//       billing_address_2: "",
//       billing_city: address.city,
//       billing_pincode: address.pincode,
//       billing_state: address.state,
//       billing_country: "India",
//       billing_email: user.email,
//       billing_phone: "91" + address.phone,
//       shipping_is_billing: true,
//       shipping_customer_name: address.firstName,
//       shipping_last_name: address.lastName,
//       shipping_address: address.street,
//       shipping_address_2: "",
//       shipping_city: address.city,
//       shipping_pincode: address.pincode,
//       shipping_country: "India",
//       shipping_state: address.state,
//       shipping_email: user.email,
//       shipping_phone: address.phone,
//       order_items: items.map((item) => ({
//         name: item.productName,
//         sku: item.productId,
//         units: item.quantity,
//         selling_price: item.price,
//         discount: 0,
//         tax: 0,
//       })),
//       payment_method: paymentMethod === "Cash on Delivery" ? "COD" : "Prepaid",
//       sub_total: totalAmount,
//       length: 10, // cm
//       breadth: 10,
//       height: 10,
//       weight: 1.5, // kg
//     };


//     // try {
//     //   const token = await getShiprocketToken();
//     //   let shiprocketResponse;
//     //   const maxRetries = 3;

//     //   for (let attempt = 1; attempt <= maxRetries; attempt++) {
//     //     try {
//     //       shiprocketResponse = await axios.post(
//     //         `${process.env.SHIPROCKET_BASE_URL}/orders/create/adhoc`,
//     //         shiprocketOrderData,
//     //         {
//     //           headers: {
//     //             Authorization: `Bearer ${token}`,
//     //             "Content-Type": "application/json",
//     //           },
//     //         }
//     //       );

//     //       // ह्या ठिकाणी response check करायचा आहे
//     //       console.log("📦 Shiprocket Response Data:", shiprocketResponse.data);

//     //       if (shiprocketResponse.data?.order_id) break;
//     //     } catch (err) {
//     //       console.warn(`Shiprocket attempt ${attempt} failed:`, err.response?.data || err.message);
//     //       if (attempt === maxRetries) throw err;
//     //       await new Promise(r => setTimeout(r, 1000 * attempt));
//     //     }
//     //   }

//     //   if (shiprocketResponse?.data?.order_id) {
//     //     newOrder.shiprocketOrderId = shiprocketResponse.data.order_id;
//     //     await newOrder.save();
//     //     console.log("✅ Shiprocket order created:", shiprocketResponse.data.order_id);
//     //   }

//     // } catch (err) {
//     //   console.error("❌ Shiprocket order creation failed:", err.response?.data || err.message);
//     //   // Optional: send admin notification here
//     // }

//     // ===== Response =====

//     try {
//       const token = await getShiprocketToken();
//       console.log("🔑 Shiprocket token:", token);

//       let shiprocketResponse;
//       const maxRetries = 3;

//       for (let attempt = 1; attempt <= maxRetries; attempt++) {
//         try {
//           shiprocketResponse = await axios.post(
//             `${process.env.SHIPROCKET_BASE_URL}/orders/create/adhoc`,
//             shiprocketOrderData,
//             {
//               headers: {
//                 Authorization: `Bearer ${token}`,
//                 "Content-Type": "application/json",
//               },
//             }
//           );

//           // ✅ Response mil gaya
//           console.log("📦 Shiprocket Response Data:", JSON.stringify(shiprocketResponse.data, null, 2));

//           if (shiprocketResponse.data?.order_id) {
//             console.log("✅ Shiprocket order created successfully!");
//             break; // success, loop se bahar niklo
//           } else {
//             console.log("⚠️ Shiprocket response received but order_id missing");
//           }

//         } catch (err) {
//           console.warn(`❌ Shiprocket attempt ${attempt} failed:`, err.response?.data || err.message);
//           if (attempt === maxRetries) {
//             console.error("❌ All Shiprocket attempts failed!");
//             shiprocketResponse = null; // ensure response null hai
//             break;
//           }
//           await new Promise(r => setTimeout(r, 1000 * attempt)); // retry delay
//         }
//       }

//       if (shiprocketResponse?.data?.order_id) {
//         newOrder.shiprocketOrderId = shiprocketResponse.data.order_id;
//         await newOrder.save();
//         console.log("✅ Shiprocket order ID saved in DB:", shiprocketResponse.data.order_id);
//       } else {
//         console.error("❌ Shiprocket order was NOT created.");
//       }

//     } catch (err) {
//       console.error("❌ Shiprocket order creation failed with error:", err.response?.data || err.message);
//     }


//     res.status(201).json({
//       success: true,
//       message: "Order placed successfully",
//       order: newOrder,
//       discountAmount,
//       userEmail: user.email,
//     });



//   } catch (error) {
//     console.error("Order placement error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//       error: error.message,
//     });
//   }
// };


// Shiprocket token generate function
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
    const { items, totalAmount, address, paymentMethod } = req.body;
    const userId = req.user?._id;

    if (!userId || !items?.length || !totalAmount || !address || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "All fields are required and items must be a non-empty array.",
      });
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
      payment: false,
      date: new Date(),
    });
    await newOrder.save();
    console.log("✅ Order saved in MongoDB:", newOrder._id.toString());

    // ===== Shiprocket Integration =====
    const shiprocketOrderData = {
      order_id: newOrder._id.toString(),
      order_date: new Date().toISOString().slice(0, 19).replace("T", " "),
      pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION_NAME, // must be valid pickup location ID
      comment: "Order from SilkSew app",
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
      payment_method: paymentMethod === "Cash on Delivery" ? "COD" : "Prepaid",
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
    } catch (err) {
      console.error(
        "❌ Shiprocket order creation failed:",
        err.response?.data || err.message
      );
      // ⚠️ DO NOT send response here — just log the error
    }

    // ===== Response =====
    // ✅ FIX #1: Send only ONE response at the end
    console.log("📦 Final Order Response:", newOrder);
    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order: newOrder, // ✅ FIX #2: changed from `order` → `newOrder`
      userEmail: user.email,
    });

  } catch (error) {
    console.error("Order placement error:", error);
    if (!res.headersSent) {
      // ✅ FIX #3: check before sending error response
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
    const { orderId } = req.params; // <-- use req.params
    const { channelId } = req.query; // optional: ?channelId=12345

    if (!orderId)
      return res.status(400).json({ success: false, message: "orderId is required" });

    const token = await getShiprocketToken();

    const url = `https://apiv2.shiprocket.in/v1/external/courier/track?order_id=${orderId}${channelId ? `&channel_id=${channelId}` : ""}`;

    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return res.json({ success: true, data: response.data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.response?.data || err.message });
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
  getTrackingData
};
