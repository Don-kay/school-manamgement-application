const express = require("express");
const sectionController = require("../controllers/sectionController");
const AuthenticateRoles = require("../middleware/AuthenticateRoles");

const router = express.Router();

router.post(
  "/new_section/:hqid/:alias/:branchid",
  // AuthenticateRoles("BRANCHNG_AND_RECRUITMENT"),
  sectionController.createSection
);
router.put(
  "/update_section/:hqid/:alias/:branchid/:sectionid",
  // AuthenticateRoles("BRANCHNG_AND_RECRUITMENT"),
  sectionController.updateSection
);
router.post(
  "/sync-section/:branchid/:hqid",
  // AuthenticateRoles("BRANCHNG_AND_RECRUITMENT"),
  sectionController.syncSection
);

module.exports = router;
