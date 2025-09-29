const Subscriber= require("../models/subscribeModel");
const nodemailer = require("nodemailer");
require("dotenv").config();

// ✅ Nodemailer Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ✅ Subscribe User
const subscribeUser = async (req, res) => {
  try {
    const { email } = req.body;

    const existing = await Subscriber.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Already subscribed!" });
    }

    const newSub = new Subscriber({ email });
    await newSub.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Thank you for subscribing to SilkSew!",
      text: `Hello, thank you for subscribing to SilkSew! 🎉 Stay tuned for new offers & sales.`,
    });

    return res.status(200).json({ message: "Subscribed successfully & email sent!" });
  } catch (error) {
    console.error("Error in subscribeUser:", error); // full error console वर
    return res.status(500).json({
      message: "Error subscribing user",
      error: error.message, // 👉 आता Postman मध्ये actual error दिसेल
    });
  }
};


// ✅ Get all subscribers (Admin)
const getAllSubscribers = async (req, res) => {
  try {
    const subscribers = await Subscriber.find().select("email"); // फक्त email field
    if (!subscribers.length) {
      return res.status(404).json({ message: "No subscribers found!" });
    }

    // प्रत्येक email सोबत status जोडून परत करतोय
    const formatted = subscribers.map((s) => ({
      email: s.email,
      status: "subscribed"
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error("Error in getAllSubscribers:", error);
    res.status(500).json({ message: "Error fetching subscribers" });
  }
};




// ✅ Send Offer Email (Admin Only)
const sendOfferEmail = async (req, res) => {
  try {
    const { offer } = req.body;
    const subscribers = await Subscriber.find();

    if (!subscribers.length) {
      return res.status(404).json({ message: "No subscribers found!" });
    }

    const emails = subscribers.map((s) => s.email);

    await transporter.sendMail({
      from: "yourgmail@gmail.com",
      to: emails,
      subject: "SilkSew New Offer 🎉",
      text: offer,
    });

    res.status(200).json({ message: "Offer email sent to all subscribers!" });
  } catch (error) {
    console.error("Error in sendOfferEmail:", error);
    res.status(500).json({ message: "Error sending offer emails" });
  }
};


module.exports = { subscribeUser,getAllSubscribers,sendOfferEmail}