const express = require("express");
const levelController = require("../controllers/yearLevelController");
const BranchClassController = require("../controllers/BranchClassController");
const AuthenticateRoles = require("../middleware/AuthenticateRoles");

const router = express.Router();

router.post(
  "/new_level",
  AuthenticateRoles("IT_OPERATION"),
  levelController.createYearLevel
);
router.post(
  "/new_level_type",
  AuthenticateRoles("IT_OPERATION"),
  levelController.createClassType
);
router.post(
  "/new-class/:alias/:branchid",
  AuthenticateRoles("IT_OPERATION"),
  BranchClassController.branchClass
);

router.put(
  "/update_level/:levelid",
  AuthenticateRoles("IT_OPERATION"),
  levelController.updateYearLevel
);
router.put(
  "/update-class/:classid",
  AuthenticateRoles("IT_OPERATION"),
  levelController.updateClassType
);
router.put(
  "/update-class/:alias/:branchid/:bclassid",
  AuthenticateRoles("IT_OPERATION"),
  BranchClassController.updateBranchClass
);
router.put(
  "/set-general-password/:alias/:branchid",
  AuthenticateRoles("IT_OPERATION"),
  BranchClassController.setBClassPassword
);
router.put("/update-class/:classid", levelController.updateClassType);

module.exports = router;
