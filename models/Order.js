const mongoose = require("mongoose")

// const orderSchema = new mongoose.Schema(
//   {
//     userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//     items: { type: Object, required: false },
//     totalAmount: { type: Number, required: false },
//     paymentMethod: { type: String, required: false, enum: ["Credit Card", "Debit Card", "PayPal", "Cash on Delivery"] },
//     address: { type: Object, required: false },
//     status: { type: String, default: "Pending" },
//     payment: { type: Boolean, required: false, default: false },
//     date: { type: Date, default: Date.now },
//     tentativeDeliveryDate: { type: Date, required: false }, // New field added
//   },
//   { timestamps: false },
// )


const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        action: { type: String, default: "Select" },  // Action specific to the product
        quantity: { type: Number, required: true },
        size: { type: String, required: true },
        returnRequested: { type: Boolean, default: false },
        returnApproved: { type: Boolean, default: false },
        returnReason: { type: String, default: "" },
      },
    ],
    totalAmount: { type: Number, required: true },
    discountAmount: Number,
    finalAmount: Number,
    paymentMethod: { type: String, required: false, enum: ["Credit Card", "Debit Card", "PayPal", "Cash on Delivery"] },
    address: { type: Object, required: true },
    status: { type: String, default: "Pending" },
    payment: { type: Boolean, required: false, default: false },
    date: { type: Date, default: Date.now },
    tentativeDeliveryDate: { type: Date, required: false }, // New field added
  },
  { timestamps: false },
)

module.exports = mongoose.model("Order", orderSchema)
