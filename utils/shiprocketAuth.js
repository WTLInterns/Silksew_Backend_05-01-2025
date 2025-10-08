const axios = require("axios");
require('dotenv').config(); 


let shiprocketToken = null;
let tokenExpiry = null;

const loginShiprocket = async () => {
  try {
    const response = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/auth/login",
      {
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD,
      }
    );

    shiprocketToken = response.data.token;
    console.log("✅ Shiprocket token generated successfully!", shiprocketToken);

    // Shiprocket token expires in ~10 days, but we’ll refresh every 24 hrs
    tokenExpiry = Date.now() + 24 * 60 * 60 * 1000;

    console.log("✅ Shiprocket token generated successfully!");
    return shiprocketToken;
  } catch (err) {
    console.error("❌ Shiprocket Login Failed:", err.response?.data || err.message);
    throw err;
  }
};

// const getShiprocketToken = async () => {
//   // if token not present or expired → refresh
//   if (!shiprocketToken || Date.now() > tokenExpiry) {
//     return await loginShiprocket();
//   }
//   return shiprocketToken;
//   console.log("shiprocketToken", shiprocketToken)
// };

const getShiprocketToken = async () => {
  // if token not present or expired → refresh
  if (!shiprocketToken || Date.now() > tokenExpiry) {
    const token = await loginShiprocket();
    console.log("shiprocketToken (refreshed):", token);
    return token;
  }

  console.log("shiprocketToken (cached):", shiprocketToken);
  return shiprocketToken;
};


module.exports = { getShiprocketToken };
