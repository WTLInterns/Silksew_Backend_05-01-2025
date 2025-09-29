// const mongoose = require("mongoose");

// const offerSchema = new mongoose.Schema({
//   code: { type: String, required: true, unique: true },

//   offerScope: {
//     type: String,
//     enum: ["category", "product", "user"], // category / product / user
//     required: true,
//   },

//   category: {
//     type: String,
//     enum: ["indian_fusion", "western", "formal"],
//     required: function () {
//       return this.offerScope === "category";
//     },
//   },

//   // eligibleProducts: [
//   //   {
//   //     type: mongoose.Schema.Types.ObjectId,
//   //     ref: "Product",
//   //     required: function () {
//   //       return this.offerScope === "product";
//   //     },
//   //   },
//   // ],

//   // eligibleUsers: [
//   //   {
//   //     type: mongoose.Schema.Types.ObjectId,
//   //     ref: "User",
//   //     required: function () {
//   //       return this.offerScope === "user";
//   //     },
//   //   },
//   // ],

//   offerType: { type: String, enum: ["percentage", "flat"], required: true },
//   value: { type: Number, required: true },

//   description: { type: String },
//   startDate: { type: Date },
//   endDate: { type: Date },

//   lastUsedAmount: { type: Number, default: 0 },
//   active: { type: Boolean, default: true },

//    calculation: {
//     actualPrice: { type: Number, default: 0 },
//     discountAmount: { type: Number, default: 0 },
//     discountPercent: { type: String, default: "0%" },
//     finalPrice: { type: Number, default: 0 },
//   }
  
// });

// module.exports = mongoose.model("Offer", offerSchema);




const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema({

  code: { type: String, required: true, unique: true },

  offerScope: {
    type: String,
    enum: ["category", "product", "user", "mahasale"], // Added "mahasale"
    required: true,
  },

  // For category-specific offers
  category: {
    type: String,
    enum: ["indian_fusion", "western", "formal"],
    required: function () {
      return this.offerScope === "category";
    },
  },

  // For mahasale (festival offers)
  // mahasale: {
  //   festivalName: { 
  //     type: String,
  //     required: function () {
  //       return this.offerScope === "mahasale";
  //     }
  //   },
  //   bannerImage: { type: String }, // URL to banner image
  //   status: {
  //     type: String,
  //     enum: ["LIVE NOW", "COMING SOON", "ENDED"],
  //     default: "COMING SOON"
  //   },
  //   themeColor: { type: String, default: "#ff3e6c" },
  //   featuredText: { type: String },
  //   // Add more mahasale-specific fields as needed
  // },

  offerType: { type: String, enum: ["percentage", "flat"], required: true },
  value: { type: Number, required: true },

  description: { type: String },
  startDate: { type: Date },
  endDate: { type: Date },

  lastUsedAmount: { type: Number, default: 0 },
  active: { type: Boolean, default: true },

  calculation: {
    actualPrice: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    discountPercent: { type: String, default: "0%" },
    finalPrice: { type: Number, default: 0 },
  }
}, { timestamps: true });

module.exports = mongoose.model("Offer", offerSchema);