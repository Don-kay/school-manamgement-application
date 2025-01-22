const express = require("express");
const sessionController = require("../controllers/sessionController");
const AuthenticateRoles = require("../middleware/AuthenticateRoles");

const router = express.Router();

router.post(
  "/copy-data/:hqid",
  // AuthenticateRoles("SET_ACADEMIC_STANDARDS"),
  sessionController.copySession
);

module.exports = router;
