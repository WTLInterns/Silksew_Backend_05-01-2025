const jwt = require("jsonwebtoken");
const User = require("../models/User"); // Assuming you have a User model

// Middleware to protect routes by verifying JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    // Prefer Authorization header with case-insensitive scheme, fallback to x-auth-token
    const authHeader = req.headers.authorization; // header names are lowercased by Node
    if (authHeader) {
      const parts = authHeader.split(" ");
      if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
        token = parts[1];
      } else if (parts.length === 1) {
        // Some clients send just the token in Authorization header
        token = parts[0];
      }
    }

    if (!token && req.headers["x-auth-token"]) {
      token = req.headers["x-auth-token"]; // support alternative header used by some clients
    }

    if (!token && req.headers["auth-token"]) {
      token = req.headers["auth-token"]; // another common variant
    }

    if (!token && req.headers["token"]) {
      token = req.headers["token"]; // fallback 'token' header
    }

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token provided" });
    }

    // Verify the token and decode the user ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user by ID and attach to request object (excluding the password)
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({ message: "Not authorized, user not found" });
    }

    next();
  } catch (error) {
    console.error("JWT verification failed:", error.message);
    return res.status(401).json({ message: "Not authorized, invalid token" });
  }
};

// Middleware to check if the user is an admin
const isAdmin = async (req, res, next) => {
  // Ensure the user is authenticated and has the "admin" role
  if (req.user && req.user.role === "admin") {
    next(); // User is an admin, proceed to the next handler
  } else {
    res.status(403).json({ message: "Not authorized as admin" });
  }
};

// Middleware to authenticate admin using the provided token
const adminAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ 
      _id: decoded._id, 
      'tokens.token': token,
      isAdmin: true 
    });

    if (!user) {
      throw new Error();
    }

    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate as an admin' });
  }
};

module.exports = { protect, isAdmin, adminAuthMiddleware };
