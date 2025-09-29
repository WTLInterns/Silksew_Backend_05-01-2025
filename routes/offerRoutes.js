const express = require("express");
const {
  createOffer,
  getOffer,
  updateOffer,
  deleteOffer,
  getOfferById,
  getActiveMahasales
  // applyOffer
} = require("../controllers/offerController");

const router = express.Router();

router.post("/create-offer", createOffer);
router.get('/mahasales/active', getActiveMahasales);
router.get("/get-offer", getOffer);
router.get("/get-offer/:id", getOfferById);
router.put("/update-offer/:id", updateOffer);
router.delete("/delete-offer/:id", deleteOffer);


module.exports = router;
