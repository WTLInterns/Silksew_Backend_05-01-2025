const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');

const createInitialSchema = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to database');

    // Example: Creating an admin user
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
    });
    await adminUser.save();

    console.log('Admin user created');
    mongoose.disconnect();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

createInitialSchema();