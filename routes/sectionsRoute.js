const express = require("express");
const sectionController = require("../controllers/sectionController");
const AuthenticateRoles = require("../middleware/AuthenticateRoles");

const router = express.Router();

router.post(
  "/new_section/:alias/:branchid",
  AuthenticateRoles("BRANCHNG_AND_RECRUITMENT"),
  sectionController.createSection
);
router.put(
  "/update_section/:alias/:branchid/:sectionid",
  AuthenticateRoles("BRANCHNG_AND_RECRUITMENT"),
  sectionController.updateSection
);

module.exports = router;
