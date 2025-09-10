// const express = require("express");
// const { createOrder, verifyPayment } = require("../controllers/paymentGatewayController");

// const router = express.Router();

// router.post("/order", createOrder);
// router.post("/verify", verifyPayment);

// module.exports = router;


const express = require("express");
const router = express.Router();
const { createOrder, verifyPayment } = require("../controllers/paymentGatewayController");

router.post("/create-order", createOrder);
router.post("/verify", verifyPayment);

module.exports = router;

