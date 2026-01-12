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


// const subscribeUser = async (req, res) => {
//   try {
//     // 1. Get and normalize email
//     const { email } = req.body;
//     const normalizedEmail = (email || "").trim().toLowerCase();
    
//     // 2. Basic validation
//     if (!normalizedEmail) {
//       return res.status(400).json({ message: "Email is required" });
//     }
    
//     // 3. Email format validation
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(normalizedEmail)) {
//       return res.status(400).json({ message: "Please enter a valid email address" });
//     }

//     // 4. Check if already subscribed
//     const existing = await Subscriber.findOne({ email: normalizedEmail });
//     if (existing) {
//       return res.status(200).json({ message: "Already subscribed!" });
//     }

//     // 5. Save new subscriber
//     const newSub = new Subscriber({ email: normalizedEmail });
//     await newSub.save();

//     // 6. Try to send email (but don't fail the request if this fails)
//     try {
//       await transporter.sendMail({
//         from: process.env.EMAIL_USER,
//         to: normalizedEmail,
//         subject: "Thank you for subscribing to SilkSew!",
//         text: `Hello, thank you for subscribing to SilkSew! 🎉 Stay tuned for new offers & sales.`,
//       });
//       return res.status(200).json({ message: "Subscribed successfully & email sent!" });
//     } catch (mailErr) {
//       console.error("Email sending failed (but subscription saved):", mailErr);
//       return res.status(200).json({ 
//         message: "Subscribed successfully! " 
//       });

//     }
//   } catch (error) {
//     console.error("Error in subscribeUser:", error);
//     return res.status(500).json({
//       message: "Error processing subscription",
//       error: error.message,
//     });
//   }
// };

const subscribeUser = async (req, res) => {
  try {
    // 1. Get and normalize email
    const { email } = req.body;
    const normalizedEmail = (email || "").trim().toLowerCase();
    
    // 2. Basic validation
    if (!normalizedEmail) {
      return res.status(400).json({ message: "Email is required" });
    }
    
    // 3. Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }

    // 4. Check if already subscribed
    const existing = await Subscriber.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(200).json({ message: "Already subscribed!" });
    }

    // 5. Save new subscriber
    const newSub = new Subscriber({ email: normalizedEmail });
    await newSub.save();

    // 6. Try to send attractive email
    try {
      const htmlTemplate = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to SilkSew!</title>
      </head>
      <body style="margin: 0; padding: 20px; background-color: #f8f9fa; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1); border: 1px solid #e9ecef;">
          <!-- Header with gradient background -->
         
          <!-- Main Content -->
          <div style="padding: 40px 30px; color: #333;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h2 style="color: #8B5CF6; font-size: 2rem; margin-bottom: 15px; font-weight: 700;">Thank You for Subscribing!</h2>
              <p style="font-size: 1.1rem; line-height: 1.6; color: #555; max-width: 500px; margin: 0 auto;">Dear Fashion Enthusiast,</p>
              <p style="font-size: 1.1rem; line-height: 1.6; color: #555; max-width: 500px; margin: 15px auto 0;">We're absolutely thrilled to welcome you to the SilkSew community! Get ready to discover exquisite fashion collections, exclusive offers, and style inspiration delivered straight to your inbox.</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #f8f5ff 0%, #fff0f7 100%); border-left: 5px solid #8B5CF6; padding: 25px; border-radius: 15px; margin: 30px 0; box-shadow: 0 5px 15px rgba(139, 92, 246, 0.1);">
              <h3 style="color: #8B5CF6; margin-bottom: 15px; font-size: 1.4rem;">✨ What You'll Receive:</h3>
              <ul style="list-style: none; padding-left: 0;">
                <li style="padding: 8px 0; padding-left: 30px; position: relative; font-size: 1.05rem;"><strong>Exclusive Early Access</strong> to new collections</li>
                <li style="padding: 8px 0; padding-left: 30px; position: relative; font-size: 1.05rem;"><strong>Special Members-Only Discounts</strong> (up to 50% OFF)</li>
                <li style="padding: 8px 0; padding-left: 30px; position: relative; font-size: 1.05rem;"><strong>Weekly Style Tips</strong> from our fashion experts</li>
                <li style="padding: 8px 0; padding-left: 30px; position: relative; font-size: 1.05rem;"><strong>First Notification</strong> of flash sales and promotions</li>
                <li style="padding: 8px 0; padding-left: 30px; position: relative; font-size: 1.05rem;"><strong>Seasonal Lookbooks</strong> and trend reports</li>
              </ul>
            </div>
            
            <div style="text-align: center;">
              <div style="display: inline-block; background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%); color: white; padding: 8px 20px; border-radius: 50px; font-weight: bold; margin: 20px 0; font-size: 1.1rem; box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);">🎁 Your Welcome Gift: 15% OFF on first order!</div>
              <p style="margin: 15px 0; color: #666;">Use code: <strong style="color: #8B5CF6;">WELCOME15</strong></p>
              
              <a href="https://silksew.com/shop" style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 1.1rem; margin: 30px 0; transition: transform 0.3s, box-shadow 0.3s; box-shadow: 0 5px 20px rgba(139, 92, 246, 0.3);">
                Start Shopping Now →
              </a>
            </div>
            
            
          </div>
          
       
        </div>
      </body>
      </html>
      `;

      const textTemplate = `Welcome to SilkSew! 🎉

Dear Fashion Enthusiast,

Thank you for subscribing to SilkSew! We're thrilled to welcome you to our exclusive fashion community.

✨ What You'll Get:
• Exclusive Early Access to new collections
• Special Members-Only Discounts (up to 50% OFF)
• Weekly Style Tips from fashion experts
• First Notification of flash sales and promotions
• Seasonal Lookbooks and trend reports

🎁 Welcome Gift: 15% OFF on your first order!
Use code: WELCOME15

Start Shopping: https://silksew.com/shop

Follow Us:
Instagram: https://instagram.com/silksew
Facebook: https://facebook.com/silksew
Pinterest: https://pinterest.com/silksew
Twitter: https://twitter.com/silksew

SilkSew Fashion House
123 Fashion Street, Style City
+91 12345 67890

© ${new Date().getFullYear()} SilkSew. All rights reserved.

You're receiving this email because you subscribed to SilkSew newsletters.
Unsubscribe: https://silksew.com/unsubscribe/${normalizedEmail}
Manage Preferences: https://silksew.com/preferences`;

      await transporter.sendMail({
        from: `"SilkSew Fashion" <${process.env.EMAIL_USER}>`,
        to: normalizedEmail,
        subject: "🎉 Welcome to SilkSew! Your Fashion Journey Begins Here",
        text: textTemplate,
        html: htmlTemplate,
      });

      return res.status(200).json({ 
        message: "Subscribed successfully! Welcome email sent with exclusive offers." 
      });
    } catch (mailErr) {
      console.error("Email sending failed (but subscription saved):", mailErr);
      return res.status(200).json({ 
        message: "Subscribed successfully! (Email delivery issue - you'll still receive updates)" 
      });
    }
  } catch (error) {
    console.error("Error in subscribeUser:", error);
    return res.status(500).json({
      message: "Error processing subscription",
      error: error.message,
    });
  }
};

// ✅ Get all subscribers (Admin)
// const getAllSubscribers = async (req, res) => {
//   try {
//     const subscribers = await Subscriber.find().select("email"); // फक्त email field
//     if (!subscribers.length) {
//       return res.status(404).json({ message: "No subscribers found!" });
//     }

//     // प्रत्येक email सोबत status जोडून परत करतोय
//     const formatted = subscribers.map((s) => ({
//       email: s.email,
//       status: "subscribed"
//     }));

//     res.status(200).json(formatted);
//   } catch (error) {
//     console.error("Error in getAllSubscribers:", error);
//     res.status(500).json({ message: "Error fetching subscribers" });
//   }
// };

const getAllSubscribers = async (req, res) => {
  try {
    const subscribers = await Subscriber.find().select("email"); // Only email field
    if (!subscribers.length) {
      return res.status(404).json({ message: "No subscribers found!" });
    }

    // Adding status with each email
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
// const sendOfferEmail = async (req, res) => {
//   try {
//     const { offer } = req.body;
//     const subscribers = await Subscriber.find();

//     if (!subscribers.length) {
//       return res.status(404).json({ message: "No subscribers found!" });
//     }

//     const emails = subscribers.map((s) => s.email);

//     await transporter.sendMail({
//       from: "yourgmail@gmail.com",
//       to: emails,
//       subject: "SilkSew New Offer 🎉",
//       text: offer,
//     });

//     res.status(200).json({ message: "Offer email sent to all subscribers!" });
//   } catch (error) {
//     console.error("Error in sendOfferEmail:", error);
//     res.status(500).json({ message: "Error sending offer emails" });
//   }
// };



const sendOfferEmail = async (req, res) => {
  try {
    const { offer } = req.body;
    const subscribers = await Subscriber.find();

    if (!subscribers.length) {
      return res.status(404).json({ message: "No subscribers found!" });
    }

    const emails = subscribers.map((s) => s.email);

    // Professional HTML template for offer announcement
    const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Special Offer from SilkSew</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
      <div style="max-width: 600px; margin: 0 auto; background: white;">
        <!-- Header -->
        <div style="background: #8B5CF6; padding: 30px 20px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 600;">SilkSew Exclusive Offer</h1>
          <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">For Our Valued Subscribers</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <!-- Offer Banner -->
          <div style="background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 30px; color: white;">
            <h2 style="margin: 0; font-size: 22px; font-weight: 600;">🎁 Special Announcement</h2>
            <p style="margin: 10px 0 0; font-size: 16px; font-weight: 500;">Limited Time Offer</p>
          </div>
          
          <!-- Offer Message -->
          <div style="background: #f8f5ff; padding: 25px; border-radius: 8px; border-left: 4px solid #8B5CF6; margin-bottom: 30px;">
            <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #333;">
              ${offer.replace(/\n/g, '<br>')}
            </p>
          </div>
          
          <!-- CTA Button -->
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="https://silksew.com/shop" 
               style="display: inline-block; background: #8B5CF6; color: white; padding: 14px 35px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
              Shop Now
            </a>
          </div>
          
          <!-- Additional Info -->
          <div style="border-top: 1px solid #e9ecef; padding-top: 25px;">
            <p style="margin: 0 0 15px; font-size: 14px; color: #666;">
              <strong>Terms & Conditions:</strong><br>
              • This offer is valid for a limited time only<br>
              • Offer may not be combined with other promotions<br>
              • Prices and availability subject to change
            </p>
            <p style="margin: 0; font-size: 14px; color: #666;">
              For any queries, please contact our customer support at 
              <a href="mailto:support@silksew.com" style="color: #8B5CF6; text-decoration: none;">support@silksew.com</a>
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e9ecef;">
          <p style="margin: 0 0 10px; font-size: 14px; color: #666;">
            <strong>SilkSew Fashion House</strong><br>
            Bringing you premium fashion collections
          </p>
          <p style="margin: 0 0 15px; font-size: 12px; color: #888;">
            © ${new Date().getFullYear()} SilkSew. All rights reserved.
          </p>
          <p style="margin: 0; font-size: 12px; color: #888;">
            You're receiving this email because you subscribed to SilkSew newsletters.<br>
            <a href="https://silksew.com/unsubscribe" style="color: #666; text-decoration: none;">Unsubscribe</a> | 
            <a href="https://silksew.com/preferences" style="color: #666; text-decoration: none;">Manage Preferences</a>
          </p>
        </div>
      </div>
    </body>
    </html>
    `;

    // Plain text version for email clients that don't support HTML
    const textTemplate = `SilkSew Exclusive Offer
=========================

🎁 Special Announcement - Limited Time Offer

${offer}

Shop Now: https://silksew.com/shop

Terms & Conditions:
• This offer is valid for a limited time only
• Offer may not be combined with other promotions
• Prices and availability subject to change

For any queries, please contact our customer support at support@silksew.com

---
SilkSew Fashion House
Bringing you premium fashion collections

© ${new Date().getFullYear()} SilkSew. All rights reserved.

You're receiving this email because you subscribed to SilkSew newsletters.
Unsubscribe: https://silksew.com/unsubscribe
Manage Preferences: https://silksew.com/preferences`;

    await transporter.sendMail({
      from: `"SilkSew Offers" <${process.env.EMAIL_USER || "yourgmail@gmail.com"}>`,
      to: emails,
      subject: "🎁 Exclusive Offer from SilkSew",
      text: textTemplate,
      html: htmlTemplate,
    });

    res.status(200).json({ 
      message: `Offer email sent successfully to ${subscribers.length} subscribers!` 
    });
  } catch (error) {
    console.error("Error in sendOfferEmail:", error);
    res.status(500).json({ 
      message: "Error sending offer emails",
      error: error.message 
    });
  }
};

module.exports = { subscribeUser,getAllSubscribers,sendOfferEmail}