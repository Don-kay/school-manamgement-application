const express = require("express");
const accessController = require("../controllers/accessController");

const router = express.Router();

router.post("/login", accessController.login);
router.post("/logout/:id", accessController.logout);

module.exports = router;
