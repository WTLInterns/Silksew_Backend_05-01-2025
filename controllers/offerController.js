const Offer = require("../models/offer")

const createOffer = async (req, res)=>{
    // const {code,offerType, value, description,startDate,endDate,eligibleProducts,active} = req.body;
    const {code, offerType, value, description, startDate, endDate, active} = req.body;
    try {
        // console.log(code, offerType, value, description,startDate,endDate,eligibleProducts,active);
        console.log(code, offerType, value, description, startDate, endDate, active);
        // const offer = new Offer({code, offerType, value, description,startDate,endDate,eligibleProducts,active});
        const offer = new Offer({code, offerType, value, description, startDate, endDate, active});
        console.log(offer)
        await offer.save();
        res.status(200).json({success:true,offer});
    } catch (error) {
        console.log(error)
        res.status(500).json({success:false,message:"Failed to create offer"})
    }
}


// const getOffer = async (req, res)=>{
    
//         try {
//             const offers = await Offer.find({
//                 active:true,
//                 startDate:{$lte:new Date()},
//                 endDate:{$gte:new Date()}
//             })
//             res.status(200).json({success:true,offers})
//         } catch (error) {
//             console.log(error)
//             res.status(500).json({success:false,message:"Failed to fetch offers",error:error.message})
//         }
        
// }

 const getOffer = async (req, res) => {
  const now = new Date();

  const active = await Offer.findOne({
    startDate: { $lte: now },
    endDate: { $gte: now },
    active: true
  });

  if (active) {
    return res.json({ status: "active", offer: active });
  }

  const upcoming = await Offer.findOne({
    startDate: { $gt: now },
    active: true
  }).sort({ startDate: 1 });

  if (upcoming) {
    return res.json({ status: "upcoming", offer: upcoming });
  }

  res.json({ status: "none" });
};


  

// const applyOffer = async (req, res)=>{
//     try {
//         const {offerCode, cartItems,totalAmount} = req.body;
//         console.log(`offerCode:${offerCode},totalAmount:${totalAmount},userCart:${JSON.stringify(cartItems)}`);

//         const offer = await Offer.findOne({code:offerCode});
//         // console.log(offer);

//          // Check if the offer is valid
//         if(!offer || !offer.active || offer.startDate > new Date() || offer.endDate < new Date()){
//             return res.status(400).json({success:false, message:'Invalid or expired offer'})
//         }

//          // Check eligibility (optional, e.g., for specific products)
//     const eligibleProducts = offer.eligibleProducts
//     console.log(`eligibleProducts:${eligibleProducts}`)
//     const applicableProducts = cartItems.filter(item =>
//       eligibleProducts.length ? eligibleProducts.includes(item.productId) : true
//     );
//     console.log(`applicableProducts:${JSON.stringify(applicableProducts)}`)
//     console.log(`length of applicableProducts:${applicableProducts.length}`)

//     let discountAmount = 0;
//     console.log(`totalAmount:${totalAmount}`)

//     if (offer.offerType === 'percentage') {
//         // Apply percentage discount
//         console.log('percentage offer')
//         discountAmount = (totalAmount * offer.value) / 100;
//       } else if (offer.type === 'flat') {
//         // Apply flat discount
//         discountAmount = offer.value;
//       }
      
//       // Apply discount to total cart value
//     const newTotalAmount = totalAmount - discountAmount;
//     console.log(`discountAmount:${discountAmount}`)
//     console.log(`newTotalAmount:${newTotalAmount}`)

//     res.status(200).json({
//         success: true,
//         message: `Offer applied successfully! Discount: $${discountAmount}`,
//         newTotalAmount,
//       });
  
//     } catch (error) {
//         console.log(error);
//         res.status(500).json({success:false,message:"Failed to apply offers",error:error.message})
//     }
// }


// const applyOffer = async (req, res) => {
//   try {
//     const { offerCode, cartItems, totalAmount } = req.body;
//     console.log(`offerCode: ${offerCode}, totalAmount: ${totalAmount}, userCart: ${JSON.stringify(cartItems)}`);

//     const offer = await Offer.findOne({ code: offerCode });

//     // Check if the offer is valid
//     if (!offer || !offer.active || offer.startDate > new Date() || offer.endDate < new Date()) {
//       return res.status(400).json({ success: false, message: 'Invalid or expired offer' });
//     }

//     let discountAmount = 0;
//     console.log(`totalAmount: ${totalAmount}`);

//     // Apply discount based on offer type
//     if (offer.offerType === 'percentage') {
//       console.log('percentage offer');
//       discountAmount = (totalAmount * offer.value) / 100;
//     } else if (offer.offerType === 'flat') {
//       console.log('flat offer');
//       discountAmount = offer.value;
//     }

//     const newTotalAmount = totalAmount - discountAmount;
//     console.log(`discountAmount: ${discountAmount}`);
//     console.log(`newTotalAmount: ${newTotalAmount}`);

//    offer.lastUsedAmount = newTotalAmount;
//     await offer.save();

//     res.status(200).json({
//       success: true,
//       message: `Offer applied successfully! Discount: ₹${discountAmount}`,
//       newTotalAmount,
//     });

//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ success: false, message: "Failed to apply offers", error: error.message });
//   }
// };




// const deleteOffer = async (req, res)=>{
//     try {
//         const offerCode = req.body;
//         console.log(offerCode);

//         const offer = await Offer.findOneAndDelete({offerCode})
//         if(!offer){
//             res.status(400).json({success:false,message:"Offer is not exist with this offer code"})
//         }

//         res.status(200).json({
//             success:true,
//             message:"Offer deleted successfully."
//         })

//     } catch (error) {
//         console.log(error);
//         res.status(500).json({success:false, message:"Failed to delete offer",error:error.message})
//     }
// }


const deleteOffer = async (req, res) => {
    try {
        const offerId = req.params.id; // Getting the offer ID from the URL parameter
        console.log(offerId);

        // Find and delete the offer by _id
        const offer = await Offer.findByIdAndDelete(offerId);
        
        if (!offer) {
            return res.status(400).json({
                success: false,
                message: "Offer does not exist with this ID"
            });
        }

        res.status(200).json({
            success: true,
            message: "Offer deleted successfully."
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Failed to delete offer",
            error: error.message
        });
    }
};


const updateOffer = async (req, res) => {
    const { id } = req.params; // Get the offer ID from the request parameters
    const { code, value, description, startDate, endDate} = req.body;

    try {
        // Find the offer by ID and update it
        const offer = await Offer.findByIdAndUpdate(
            id,
            { code, value, description, startDate, endDate},
            { new: true } // To return the updated offer
        );

        // Check if the offer exists
        if (!offer) {
            return res.status(404).json({ success: false, message: "Offer not found" });
        }

        // Send the updated offer back
        res.status(200).json({ success: true, offer });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to update offer" });
    }
};




module.exports = {
    createOffer,
    getOffer,
    updateOffer,
    deleteOffer
}
