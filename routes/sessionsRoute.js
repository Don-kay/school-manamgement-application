const express = require("express");
const sessionController = require("../controllers/sessionController");

const router = express.Router();

router.post("/new_session", sessionController.createSession);
router.put("/update_session/:sessionid", sessionController.updateSession);

module.exports = router;
