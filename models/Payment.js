// import mongoose from "mongoose";

// const PaymentSchema = new mongoose.Schema({
//   razorpay_order_id: { type: String, required: true },
//   razorpay_payment_id: { type: String, required: true },
//   razorpay_signature: { type: String, required: true },
//   amount: { type: Number, required: true }
// }, { timestamps: true });

// export default mongoose.model("Payment", PaymentSchema);


const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  razorpay_order_id: { type: String, required: true, index: true },
  razorpay_payment_id: { type: String, required: true, unique: true },
  razorpay_signature: { type: String, required: true },
  amount: { type: Number, required: true }, // store in INR (not paise)
  status: { type: String, default: "captured" }, // captured/failed
}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);
