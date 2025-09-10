const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET, JWT_EXPIRATION } = require('../config/jwtConfig');

// Hash password for a new user before saving to the database
const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

// Register a new user
const registerUser = async (userData) => {
    try {
        const { email, password } = userData;
        
        // Check if the user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new Error('User already exists');
        }

        // Hash password before saving
        const hashedPassword = await hashPassword(password);
        const newUser = new User({ ...userData, password: hashedPassword });
        await newUser.save();
        return newUser;
    } catch (err) {
        throw new Error('Error registering user: ' + err.message);
    }
};

// Login user and generate a JWT token
const loginUser = async (email, password) => {
    try {
        const user = await User.findOne({ email });
        if (!user) {
            throw new Error('Invalid email or password');
        }

        // Compare the hashed password with the entered password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error('Invalid email or password');
        }

        // Generate a JWT token for the user
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
        return { user, token };
    } catch (err) {
        throw new Error('Error logging in user: ' + err.message);
    }
};

// Get user by ID
const getUserById = async (userId) => {
    try {
        const user = await User.findById(userId).select('-password');  // Exclude password from the response
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    } catch (err) {
        throw new Error('Error fetching user: ' + err.message);
    }
};

// Update user information
const updateUser = async (userId, updateData) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true }).select('-password');
        if (!updatedUser) {
            throw new Error('User not found');
        }
        return updatedUser;
    } catch (err) {
        throw new Error('Error updating user: ' + err.message);
    }
};

// Delete user
const deleteUser = async (userId) => {
    try {
        const deletedUser = await User.findByIdAndDelete(userId);
        if (!deletedUser) {
            throw new Error('User not found');
        }
        return deletedUser;
    } catch (err) {
        throw new Error('Error deleting user: ' + err.message);
    }
};

// Verify JWT token and return user ID
const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded.userId;
    } catch (err) {
        throw new Error('Invalid or expired token');
    }
};

module.exports = {
    registerUser,
    loginUser,
    getUserById,
    updateUser,
    deleteUser,
    verifyToken
};
