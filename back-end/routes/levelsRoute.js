const express = require("express");
const levelController = require("../controllers/yearLevelController");
const BranchClassController = require("../controllers/BranchClassController");
const AuthenticateRoles = require("../middleware/AuthenticateRoles");

const router = express.Router();

router.post(
  "/new_level/:hqid",
  // AuthenticateRoles("IT_OPERATION"),
  levelController.createYearLevel
);
router.post(
  "/new-class-type/:hqid",
  // AuthenticateRoles("IT_OPERATION"),
  levelController.createClassType
);
router.post(
  "/new-class/:alias/:branchid",
  // AuthenticateRoles("IT_OPERATION"),
  BranchClassController.branchClass
);
router.post(
  "/link-learner-to-class/:alias/:branchid",
  // AuthenticateRoles("IT_OPERATION"),
  BranchClassController.linkLearnerToClass
);
router.post(
  "/delink-learner-from-class/:alias/:branchid/:learnerid/:levelid/:classid",
  // AuthenticateRoles("IT_OPERATION"),
  BranchClassController.delinkLearnerFromClass
);

router.put(
  "/update-level/:hqid/:levelid",
  // AuthenticateRoles("IT_OPERATION"),
  levelController.updateYearLevel
);
router.post("/sync-level/:branchid/:hqid", levelController.syncYearLevel);
router.put(
  "/update-class/:hqid/:classid",
  // AuthenticateRoles("IT_OPERATION"),
  levelController.updateClassType
);

router.post("/sync-class/:branchid/:hqid", levelController.syncClassType);
router.put(
  "/update-class/:alias/:branchid/:levelid/:classid",
  // AuthenticateRoles("IT_OPERATION"),
  BranchClassController.updateBranchClass
);

router.put("/update-class/:classid", levelController.updateClassType);

module.exports = router;
