const express = require("express");
const accessController = require("../controllers/accessController");
const Authentication = require("../middleware/Authentication");

const router = express.Router();

router.post("/login/:branchid", accessController.login);
router.post("/logout/:branchid/:id", Authentication, accessController.logout);

module.exports = router;
