const express = require("express");
// import { isAdmin, protect } from "../middleware/authMiddleware.js";
const {createOffer, getOffer, deleteOffer, updateOffer}  = require("../controllers/offerController.js")

const router = express.Router()

router.post('/create-offer',
    // protect,
    // isAdmin,
    createOffer
)

router.get('/get-offer',getOffer)

// router.post('/apply-offer',applyOffer)

router.delete('/delete-offer/:id',deleteOffer)

router.put('/update-offer/:id', updateOffer);

module.exports = router;
