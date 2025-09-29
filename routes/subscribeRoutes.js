const express = require("express");
const { subscribeUser, getAllSubscribers, sendOfferEmail } = require("../controllers/subscribeController");

const router = express.Router();

// POST /api/subscribe
router.post("/subscribe", subscribeUser);

// POST /api/send-offer  (Admin can call this)
router.post("/send-offer", sendOfferEmail);

router.get("/list", getAllSubscribers);

module.exports = router;
