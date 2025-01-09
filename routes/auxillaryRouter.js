const express = require("express");
const AuxController = require("../controllers/schoolAuxillieryController");
const AuthenticateRoles = require("../middleware/AuthenticateRoles");
const branchRouter = require("./branchIdRouter");
const router = express.Router();

router.post(
  "/new-general-tag/:hqid",
  // AuthenticateRoles("IT_OPERATION"),
  AuxController.GeneralTagController
);
router.post(
  "/new_role/:hqid",
  // AuthenticateRoles("IT_OPERATION"),
  AuxController.rolesController
);
router.post(
  "/new_role_hierarchy/:hqid",
  // AuthenticateRoles("IT_OPERATION"),
  AuxController.rolesHierarchyController
);
router.post(
  "/new_role_permission/:hqid",
  // AuthenticateRoles("IT_OPERATION"),
  AuxController.rolesPermissionController
);
router.post(
  "/new-school-mail/:hqid",
  // AuthenticateRoles("IT_OPERATION"),
  AuxController.schoolMailController
);
// router.post("/new-staff-code", AuxController.staffCodeController);
router.post(
  "/new-permission/:hqid",
  // AuthenticateRoles("IT_OPERATION"),
  AuxController.permissionController
);
// router.put(
//   "/update_branchcode/:alias/:branchid/:codeid",
//   AuthenticateRoles("BRANCHING_AND_RECRUITMENT"),
//   AuxController.updateBranchcodeController
// );
router.put(
  "/update-general-tag/:hqid/:tagid",
  // AuthenticateRoles("IT_OPERATION"),
  AuxController.updateGeneralTagController
);
router.put(
  "/update-role/:hqid/:roleid",
  // AuthenticateRoles("IT_OPERATION"),
  AuxController.updateRoleController
);
router.put(
  "/update-school-mail/:hqid/:mailid",
  // AuthenticateRoles("IT_OPERATION"),
  AuxController.updateSchoolMailController
);
// branchRouter.put(
//   "/update_branch/:alias/:branchid",
//   // AuthenticateRoles("BRANCHING_AND_RECRUITMENT"),
//   AuxController.updateBranchController
// );
router.put(
  "/update-permission/:hqid/:permissionid",
  // AuthenticateRoles("IT_OPERATION"),
  AuxController.updatePermissionController
);
router.delete(
  "/delete_role_hierarchy/:hqid/:roleid/:paRole",
  // AuthenticateRoles("IT_OPERATION"),
  AuxController.deleteRolehierarachyController
);
router.delete(
  "/delete_role_permission/:hqid/:permid/:roleid",
  // AuthenticateRoles("IT_OPERATION"),
  AuxController.deleteRolePermissionController
);

module.exports = router;
