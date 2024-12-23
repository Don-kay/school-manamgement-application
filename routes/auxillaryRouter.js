const express = require("express");
const AuxController = require("../controllers/schoolAuxillieryController");
const AuthenticateRoles = require("../middleware/AuthenticateRoles");
const branchRouter = require("./branchIdRouter");
const router = express.Router();

// router.post(
//   "/new_branchcode/:alias/:branchid",
//   AuxController.branchCodeController
// );
router.post(
  "/new-general-code",
  AuthenticateRoles("IT_OPERATION"),
  AuxController.GeneralTagController
);
router.post(
  "/new_role",
  AuthenticateRoles("IT_OPERATION"),
  AuxController.rolesController
);
router.post(
  "/new_role_hierarchy",
  AuthenticateRoles("IT_OPERATION"),
  AuxController.rolesHierarchyController
);
router.post(
  "/new_role_permission",
  AuthenticateRoles("IT_OPERATION"),
  AuxController.rolesPermissionController
);
router.post(
  "/new_branch",
  // AuthenticateRoles("BRANCHING_AND_RECRUITMENT"),
  AuxController.BranchController
);
router.post(
  "/new-school-mail",
  AuthenticateRoles("IT_OPERATION"),
  AuxController.schoolMailController
);
// router.post("/new-staff-code", AuxController.staffCodeController);
router.post(
  "/new-permission",
  AuthenticateRoles("IT_OPERATION"),
  AuxController.permissionController
);
// router.put(
//   "/update_branchcode/:alias/:branchid/:codeid",
//   AuthenticateRoles("BRANCHING_AND_RECRUITMENT"),
//   AuxController.updateBranchcodeController
// );
router.put(
  "/update-general-code/:tagid",
  AuthenticateRoles("IT_OPERATION"),
  AuxController.updateGeneralTagController
);
router.put(
  "/update-role/:roleid",
  AuthenticateRoles("IT_OPERATION"),
  AuxController.updateRoleController
);
router.put(
  "/update-school-mail/:mailid",
  AuthenticateRoles("IT_OPERATION"),
  AuxController.updateSchoolMailController
);
// branchRouter.put(
//   "/update_branch/:alias/:branchid",
//   // AuthenticateRoles("BRANCHING_AND_RECRUITMENT"),
//   AuxController.updateBranchController
// );
router.put(
  "/update-permission/:permissionid",
  AuthenticateRoles("IT_OPERATION"),
  AuxController.updatePermissionController
);
router.delete(
  "/delete_role_hierarchy/:roleid/:paRole",
  AuthenticateRoles("IT_OPERATION"),
  AuxController.deleteRolehierarachyController
);
router.delete(
  "/delete_role_permission/:permid/:roleid",
  AuthenticateRoles("IT_OPERATION"),
  AuxController.deleteRolePermissionController
);

module.exports = router;
