const express = require("express");
const termController = require("../controllers/termController");

const router = express.Router();

router.post("/new_term", termController.createTerm);
router.put("/update_term/:termid", termController.updateTerm);

module.exports = router;
