const express = require("express");
const paymentController = require("../controllers/paymentController");
const paymentinstallmentController = require("../controllers/paymentController");

const router = express.Router();

router.post("/payment_transit/:parentid", paymentController.Payments);
router.put(
  "/payment_transit/installment/:parentid",
  paymentinstallmentController.PaymentInstallment
);
//router.put("/payment_transit/:termid", paymentController);

module.exports = router;
