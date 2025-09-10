const mongoose = require("mongoose")

const issueSchema = new mongoose.Schema(
  {
    recipientId: {
      type: String,
      required: true,
      trim: true,
    },
    recipientName: {
      type: String,
      required: true,
      trim: true,
    },
    issue: {
      type: String,
      required: true,
    },
    related: {
      type: String,
      required: true,
      enum: ["Quality", "Packaging", "Inventory", "Pricing", "Category"],
    },
    status: {
      type: String,
      required: true,
      enum: ["Resolved", "Unresolved"],
      default: "Unresolved",
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("Issue", issueSchema)

