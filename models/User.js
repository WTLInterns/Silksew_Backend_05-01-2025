const mongoose = require("mongoose"); // Add this line
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: function() {
        return !this.googleId || this.password;
      },
      trim: true,
    },
    email: {
      type: String,
      required: function() {
        return !this.googleId || this.password;
      },
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: function() {
        return !this.googleId;
      },
      minlength: 6,
    },
    phone: {
      type: String,
      required: function() {
        return !this.googleId;
      },
      length: 10,
    },
    street: {
      type: String,
      required: function() {
        return !this.googleId;
      },
      lowercase: true,
    },
    city: {
      type: String,
      required: function() {
        return !this.googleId;
      },
      lowercase: true,
    },
    state: {
      type: String,
      required: function() {
        return !this.googleId;
      },
      lowercase: true,
    },
    zipcode: {
      type: String,
      required: function() {
        return !this.googleId;
      },
      lowercase: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    // Google OAuth fields
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values
    },
    profilePicture: {
      type: String,
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
    verifyToken: {
      type: String,
    },
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
