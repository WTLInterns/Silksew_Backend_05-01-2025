const User = require('../models/User');
const jwt = require('jsonwebtoken');
require("dotenv").config();
const nodemailer = require("nodemailer");
var bcrypt = require("bcryptjs");

// ✅ Check here
console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "loaded" : "missing");


// Register a new user
// const registerUser = async (req, res) => {
//   try {
//     const { name, email, password } = req.body;

//     // Validate required fields
//     if (!name || !email || !password) {
//       return res.status(400).json({ message: 'All fields are required' });
//     }

//     // Check if the user already exists
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ message: 'User already exists' });
//     }

//     // Create and save a new user
//     const newUser = new User({ name, email, password });
//     await newUser.save();

//     res.status(201).json({ message: 'User registered successfully' });
//   } catch (error) {
//     res.status(500).json({ message: 'Error registering user', error: error.message });
//   }
// };

// for signup





const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, street, city, state, zipcode } = req.body;

    // Validate required fields
    if (!name || !email || !password || !phone || !street || !city || !state || !zipcode) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create and save a new user
    const newUser = new User({
      name,
      email,
      password,
      phone,
      street,
      city,
      state,
      zipcode
    });

    await newUser.save();

    res.status(201).json({ message: 'User registered successfully', user: newUser });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
};







// Login a user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Compare the provided password with the stored password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate a JWT token
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    // Send response with token and user information
    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role, // Include role for frontend role-based navigation
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
};


const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password'); // Exclude password from response
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user profile', error: error.message });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user fields if provided
    user.name = name || user.name;
    user.email = email || user.email;
    if (password) {
      user.password = password;
    }

    await user.save();

    res.status(200).json({ message: 'User profile updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};


//  email config

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user:process.env.EMAIL_USER,
//     pass:process.env.EMAIL_PASS
//   }
// })

// const resetPassword = async (req, res) => {
//   const { email } = req.body;

//   if (!email) {
//     return res.status(401).json({ message: 'Email is required' });
//   }

//   console.log('Received email:', email); // Log email to console

//   try {
//     const userFind = await User.findOne({ email: email });

//     // token generate for reset password
//     const token = jwt.sign({ _id: userFind._id }, process.env.JWT_SECRET, {
//       expiresIn: "2m"
//     })

//     const setusertoken = await User.findByIdAndUpdate({ _id: userFind._id }, { verifyToken: token }, { new: true });

//     if (setusertoken) {
//       const mailOptions = {
//         from: "gfullstackwtl@gmail.com",
//         to: email,
//         subject: "Password Reset Request",
//         text: `Click on this link to reset your password: https://api.silksew.com/forgotPassword/${userFind.id}/${setusertoken.verifyToken}`
//       }

//       transporter.sendMail(mailOptions, (error, info) => {
//         if (error) {
//           console.log("error", error);
//           res.status(401).json({ status: 401, message: "email not send" });
//         } else {
//           console.log("Email sent", info.response);
//           res.status(201).json({ status: 201, message: "Email sent Successfully" });
//         }
//       })
//     }

//   } catch (error) {
//     res.status(401).json({ status: 401, message: "invalid user" });

//   }
// }

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "silksew30@gmail.com",  // put email directly
    pass: "pwgxugowapzfchoj"      // app password directly
  }
});


const resetPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(401).json({ message: "Email is required" });
  }

  try {
    const userFind = await User.findOne({ email: email });
    if (!userFind) return res.status(404).json({ message: "User not found" });

    // 1. Generate new token with proper expiry
    const token = jwt.sign({ _id: userFind._id }, process.env.JWT_SECRET, {
      expiresIn: "10m" // increase expiry for testing
    });

    // 2. Update user's verifyToken in DB
    const setusertoken = await User.findByIdAndUpdate(
      userFind._id,         // filter
      { verifyToken: token }, // update
      { new: true }          // return updated doc
    );

    if (!setusertoken) {
      return res.status(500).json({ message: "Failed to save token" });
    }

    // 3. Send email with the new token
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request",
      text: `Click this link to reset password: https://api.silksew.com/forgotPassword/${userFind._id}/${setusertoken.verifyToken}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Email error:", error);
        return res.status(500).json({ message: "Email not sent", error: error.message });
      } else {
        console.log("Email sent:", info.response);
        return res.status(201).json({ message: "Email sent successfully" });
      }
    });

  } catch (error) {
    console.error("Reset password error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



// verify user for forgot password time

const forgotPassword = async (req, res) => {
  const { id, token } = req.params;

  try {
    const validUser = await User.findOne({ _id: id, verifyToken: token })
    const verifyToken = jwt.verify(token, process.env.JWT_SECRET);
    console.log(verifyToken);
    if (validUser && verifyToken._id) {
      res.status(201).json({ status: 201, validUser })
    } else {
      res.status(401).json({ status: 401, message: "user not exist" })
    }
  } catch (error) {
    res.status(401).json({ status: 401, error })
  }
}

// change password

// const changePassword = async (req, res) => {
//   const { id, token } = req.params;

//   const { password } = req.body;
//   try {
//     const validUser = await User.findOne({ _id: id, verifyToken: token })
//     const verifyToken = jwt.verify(token, process.env.JWT_SECRET);

//     if (validUser && verifyToken._id) {
//       const newPassword = await bcrypt.hash(password, 12);

//       const setNewPass = await User.findByIdAndUpdate({ _id: id }, { password: newPassword });

//       setNewPass.save();
//       res.status(201).json({ status: 201, setNewPass })

//     } else {
//       res.status(401).json({ status: 401, message: "user not exist" })
//     }

//   } catch (error) {
//     res.status(401).json({ status: 401, error })
//   }
// }

// const changePassword = async (req, res) => {
//   const { id, token } = req.params;
//   const { password } = req.body;

//   try {
//     console.log("Incoming ID:", id);
//     console.log("Incoming Token:", token);

//     const validUser = await User.findOne({ _id: id, verifyToken: token });
//     console.log("Found user:", validUser);

//     if (!validUser) {
//       return res.status(404).json({ status: 404, message: "User not found or invalid token" });
//     }

//     const verifyToken = jwt.verify(token, process.env.JWT_SECRET);

//     if (verifyToken._id) {
//       const newPassword = await bcrypt.hash(password, 12);
//       validUser.password = newPassword;
//       validUser.verifyToken = ""; // clear the token after use
//       await validUser.save();

//       return res.status(201).json({ status: 201, message: "Password updated" });
//     } else {
//       return res.status(401).json({ status: 401, message: "Invalid token" });
//     }

//   } catch (error) {
//     console.error("Error in changePassword:", error.message);
//     res.status(500).json({ status: 500, error: error.message });
//   }
// };

const changePassword = async (req, res) => {
  const { id, token } = req.params;
  const { password } = req.body;

  try {
    console.log("Incoming ID:", id);
    console.log("Incoming Token:", token);

    const validUser = await User.findOne({ _id: id, verifyToken: token });
    console.log("Found user:", validUser);

    if (!validUser) {
      return res
        .status(404)
        .json({ status: 404, message: "User not found or invalid token" });
    }

    // verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded._id) {
      // ✅ assign plain password, pre-save hook will hash
      validUser.password = password;
      validUser.verifyToken = ""; // clear token after reset
      await validUser.save();

      return res
        .status(201)
        .json({ status: 201, message: "Password updated successfully" });
    } else {
      return res.status(401).json({ status: 401, message: "Invalid token" });
    }
  } catch (error) {
    console.error("Error in changePassword:", error.message);
    res.status(500).json({ status: 500, error: error.message });
  }
};



// user profile details fetch
const getUserProfileDetail = async (req, res) => {
  try {
    const userProfile = await User.findById(req?.user?.id); // Find user by _id

    console.log(userProfile)

    if (!userProfile) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(userProfile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// update user profile details
const updateUserProfileDetail = async (req, res) => {
  try {
    const userId = req.user.id; // Extract user ID from request
    const updates = req.body; // Get fields to update from request body

    // Find and update user by _id
    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      new: true, // Return updated document
      runValidators: true, // Ensure validation rules apply
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Profile updated successfully", updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Error updating profile", error: error.message });
  }
};




module.exports = { registerUser, loginUser, getUserProfile, updateUserProfile, changePassword, forgotPassword, resetPassword, getUserProfileDetail, updateUserProfileDetail };
