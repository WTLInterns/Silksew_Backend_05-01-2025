const Offer = require("../models/offer")
const mongoose = require ("mongoose")

const createOffer = async (req, res) => {
  const {
    code,
    offerScope,
    category,
    offerType,
    value,
    description,
    startDate,
    endDate,
    active,
    price,
    productId,
    mahasale
  } = req.body;

  console.log("debugging",req.body);

  try {
    console.log("📥 Incoming request body:", JSON.stringify(req.body, null, 2));

    // 1️⃣ Initialize calculation defaults
    let discountAmount = 0;
    let discountPercent = 0;
    let finalPrice = price || 0;

    // 2️⃣ FIXED: Determine if discount should be applied (include mahasale)
    const shouldApplyDiscount =
      (offerScope === "category" && category) || 
      (offerScope === "mahasale");

    // 3️⃣ Calculate discount if price exists
    if (price && shouldApplyDiscount) {
      if (offerType === "percentage") {
        discountPercent = value;
        discountAmount = (price * value) / 100;
      } else if (offerType === "flat") {
        discountAmount = value;
        discountPercent = ((value / price) * 100).toFixed(2);
      }

      finalPrice = price - discountAmount;
      if (finalPrice < 0) finalPrice = 0;
    }

    // 4️⃣ Prepare calculation data
    const calculationData = {
      actualPrice: price || 0,
      discountAmount,
      discountPercent: `${discountPercent}%`,
      finalPrice,
    };

    console.log("⚡ Calculation Data:", calculationData);

    // 5️⃣ Create Offer data - FIXED: Only include category if it's a category offer
    const offerData = {
      code,
      offerScope,
      offerType,
      value: Number(value),
      description,
      startDate,
      endDate,
      active: Boolean(active),
      calculation: calculationData,
    };

    // Add category only for category offers
    if (offerScope === "category") {
      offerData.category = category;
    }

    // If offer is mahasale, attach festival data
    if (offerScope === "mahasale" && mahasale) {
      offerData.mahasale = {
        festivalName: mahasale.festivalName || "Festival Sale",
        bannerImage: mahasale.bannerImage || "",
        status: mahasale.status || "COMING SOON",
        themeColor: mahasale.themeColor || "#ff3e6c",
        featuredText: mahasale.featuredText || "",
      };
    }

    const offer = new Offer(offerData);
    const data = await offer.save();
    console.log("💾 Offer saved successfully:", JSON.stringify(data, null, 2));

    // 6️⃣ Send response
    res.status(201).json({
      success: true,
      message: "Offer created successfully",
      offer: data,
    });
  } catch (error) {
    console.error("❌ Error creating offer:", error);
    console.error("❌ Error details:", error.message);
    console.error("❌ Error stack:", error.stack);
    
    // More specific error handling
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: "Offer code already exists" 
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: `Validation error: ${error.message}` 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Failed to create offer",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};



const getActiveMahasales = async (req, res) => {
  try {
    const currentDate = new Date();
    console.log("🕒 Current server time:", currentDate.toISOString());
    
    // Debug: Check all mahasale offers first
    const allMahasales = await Offer.find({ offerScope: "mahasale" });
    console.log("📋 All mahasale offers in DB:", allMahasales.length);
    
    if (allMahasales.length > 0) {
      allMahasales.forEach(offer => {
        console.log(`\n📊 Offer: ${offer.code}`);
        console.log(`   Active: ${offer.active}`);
        console.log(`   Start Date: ${offer.startDate}`);
        console.log(`   End Date: ${offer.endDate}`);
        console.log(`   Current Date: ${currentDate}`);
        console.log(`   Start <= Current: ${offer.startDate <= currentDate}`);
        console.log(`   End >= Current: ${offer.endDate >= currentDate}`);
        console.log(`   Is Active Now: ${offer.active && offer.startDate <= currentDate && offer.endDate >= currentDate}`);
      });
    } else {
      console.log("❌ No mahasale offers found in database");
    }
    
    // Get active mahasales with proper date comparison
    const mahasales = await Offer.find({
      offerScope: "mahasale",
      active: true,
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate }
    }).sort({ createdAt: -1 });

    console.log("✅ Active mahasales found:", mahasales.length);
    
    res.status(200).json({
      success: true,
      mahasales,
      count: mahasales.length,
      currentTime: currentDate.toISOString() // Helpful for debugging
    });
  } catch (error) {
    console.error("❌ Error fetching mahasales:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch mahasales",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getOffer = async (req, res) => {
  try {
    const today = new Date();

    const offers = await Offer.find({
      active: true,
      endDate: { $gte: today },
    });

    // Countdown calculate करून attach करू
    const offersWithCountdown = offers.map((offer) => {
      const endDate = new Date(offer.endDate);
      const now = new Date();
      let timeLeft = endDate - now;

      if (timeLeft < 0) {
        timeLeft = 0; // Expired असेल तर 0
      }

      return {
        ...offer.toObject(),
        timeLeft, // milliseconds मध्ये उरलेला वेळ
      };
    });

    res.status(200).json({ success: true, offers: offersWithCountdown });
  } catch (error) {
    console.error("Error fetching offers:", error);
    res.status(500).json({ success: false, message: "Failed to fetch offers" });
  }
};


const getOfferById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if id is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid offer ID" });
    }

    const offer = await Offer.findById(id);

    if (!offer) {
      return res.status(404).json({ success: false, message: "Offer not found" });
    }

    // countdown attach kara (same as getOffer)
    const endDate = new Date(offer.endDate);
    const now = new Date();
    let timeLeft = endDate - now;

    if (timeLeft < 0) timeLeft = 0;

    res.status(200).json({ 
      success: true, 
      offer: { ...offer.toObject(), timeLeft } 
    });
  } catch (error) {
    console.error("Error fetching offer by ID:", error);
    res.status(500).json({ success: false, message: "Failed to fetch offer by ID" });
  }
};




// const updateOffer = async (req, res) => {
//   const { id } = req.params;
//   const updateData = req.body;

//   try {
//     const offer = await Offer.findByIdAndUpdate(id, updateData, { new: true });

//     if (!offer) {
//       return res.status(404).json({ success: false, message: "Offer not found" });
//     }

//     res.status(200).json({ success: true, offer });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to update offer" });
//   }
// };

const updateOffer = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    // Add validation for required fields
    const requiredFields = ['code', 'offerScope', 'offerType', 'value', 'startDate', 'endDate'];
    const missingFields = requiredFields.filter(field => !updateData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    // Recalculate the offer details
    let discountAmount = 0;
    let discountPercent = 0;
    let finalPrice = updateData.price || 0;

    if (updateData.price && (updateData.offerScope === "category" || updateData.offerScope === "mahasale")) {
      if (updateData.offerType === "percentage") {
        discountPercent = updateData.value;
        discountAmount = (updateData.price * updateData.value) / 100;
      } else if (updateData.offerType === "flat") {
        discountAmount = updateData.value;
        discountPercent = ((updateData.value / updateData.price) * 100).toFixed(2);
      }

      finalPrice = updateData.price - discountAmount;
      if (finalPrice < 0) finalPrice = 0;
    }

    // Prepare the update object
    const updateObj = {
      ...updateData,
      calculation: {
        actualPrice: updateData.price || 0,
        discountAmount,
        discountPercent: `${discountPercent}%`,
        finalPrice,
      },
      active: Boolean(updateData.active),
      value: Number(updateData.value)
    };

    // Only include category if it's a category offer
    if (updateData.offerScope !== "category") {
      delete updateObj.category;
    }

    const offer = await Offer.findByIdAndUpdate(
      id, 
      { $set: updateObj },
      { new: true, runValidators: true }
    );

    if (!offer) {
      return res.status(404).json({ success: false, message: "Offer not found" });
    }

    res.status(200).json({ 
      success: true, 
      message: "Offer updated successfully",
      offer 
    });
  } catch (error) {
    console.error("Error updating offer:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update offer",
      error: error.message 
    });
  }
};

const deleteOffer = async (req, res) => {
  try {
    const offerId = req.params.id;
    const offer = await Offer.findByIdAndDelete(offerId);

    if (!offer) {
      return res.status(400).json({
        success: false,
        message: "Offer does not exist with this ID",
      });
    }

    res.status(200).json({
      success: true,
      message: "Offer deleted successfully.",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Failed to delete offer",
      error: error.message,
    });
  }
};


module.exports = {
    createOffer,
    getActiveMahasales,
    getOffer,
    updateOffer,
    deleteOffer,
    getOfferById,
}