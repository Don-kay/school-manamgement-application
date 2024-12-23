const express = require("express");
const parentController = require("../controllers/parentsController");
const AuthenticateRoles = require("../middleware/AuthenticateRoles");

const router = express.Router();

router.post(
  "/branch/new-parents/:alias/:branchid",
  //AuthenticateRoles("MANAGE_STUDENT"),
  parentController.createParent
);
router.put(
  "/branch/update-parents/:alias/:branchid/:parentid",
  AuthenticateRoles("MANAGE_STUDENT"),
  parentController.updateParent
);
router.put(
  "/update-parents/registeredkids/:parentid",
  parentController.registeredKids
);

module.exports = router;
