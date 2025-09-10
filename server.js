const express = require("express")
const dotenv = require("dotenv")
const morgan = require("morgan")
const cors = require("cors")
const connectDB = require("./config/db")
const { errorHandler } = require("./middleware/errorMiddleware")
const uploadRoute = require("./controllers/routeUpload")

// Import routes
const productRoutes = require("./routes/productRoutes")
const userRoutes = require("./routes/userRoutes")
const cartRoutes = require("./routes/cartRoutes")
const orderRoutes = require("./routes/orderRoutes")
const issueRoutes = require("./routes/issueRoutes") // New import for issues
const reviewRoutes = require("./routes/reviewRoutes")
const favoriteRoutes = require("./routes/favoriteRoutes")

const resetPasswordRoutes = require("./routes/userRoutes")
const forgotPasswordRoutes = require("./routes/userRoutes")
const changePasswordRoutes = require("./routes/userRoutes")

const updatePaymentStatus = require("./routes/orderRoutes")
const updateOrderStatus = require("./routes/orderRoutes")

const offerRoutes = require('./routes/offerRoutes')
const paymentGatewayRoutes = require("./routes/paymentGatewayRoute");





// Load environment variables
dotenv.config()

// Connect to the database
connectDB()

// Initialize Express app
const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Logging middleware for development
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"))
}

// API Routes
app.use("/api/products", productRoutes)
app.use("/api/users", userRoutes)
app.use("/api/cart", cartRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/upload", uploadRoute)
app.use("/api/issues", issueRoutes) // New route for issues
app.use('/api/review',reviewRoutes)

app.use("/api/reset-password", resetPasswordRoutes)
app.use("/api/forgot-password", forgotPasswordRoutes)
app.use("/api/change-password", changePasswordRoutes)

app.use("/api/updateOrderStatus", updateOrderStatus)
app.use("/api/updatePayment", updatePaymentStatus)

app.use('/api/userProfileDetail', userRoutes)
app.use('/api/updateUserProfileDetail', userRoutes)
app.use("/api/offer",offerRoutes);
app.use("/api/payment", paymentGatewayRoutes);
app.use("/api/favorites", favoriteRoutes);

// Default route for root endpoint
app.get("/", (req, res) => {
  res.send("API is running...")
})

// Error handling middleware
app.use(errorHandler)

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`)
  next()
})

// Start the server
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

