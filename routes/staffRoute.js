const express = require("express");
const staffController = require("../controllers/staffController");
const AuthenticateRoles = require("../middleware/AuthenticateRoles");
const router = express.Router();

router.post(
  "/new-staff",
  AuthenticateRoles("BRANCHING_AND_RECRUITMENT"),
  staffController.createStaff
);
router.put(
  "/update-staff/new-password",
  AuthenticateRoles("BRANCHING_AND_RECRUITMENT"),
  staffController.createGeneralPassword
);
router.put(
  "/update-staff/:staffid",
  // AuthenticateRoles("BRANCHING_AND_RECRUITMENT"),
  staffController.updateStaff
);
router.put(
  "/update-staff/role/:staffid",
  AuthenticateRoles("BRANCHING_AND_RECRUITMENT"),
  staffController.assignStaffRole
);

// router.put(
//   "/update-parents/registeredkids/:parentid",
//   parentController.registeredKids
// );

module.exports = router;
