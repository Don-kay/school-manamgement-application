const express = require("express");
const AcademicController = require("../controllers/academicController");
const AuthenticateRoles = require("../middleware/AuthenticateRoles");
const router = express.Router();

// router.post(
//   "/new_branchcode/:alias/:branchid",
//   AuxController.branchCodeController
// );
router.post(
  "/new_assessment_type",
  AuthenticateRoles("SET_ACADEMIC_STANDARDS"),
  AcademicController.createAssessment_type
);
router.post(
  "/new_subject",
  AuthenticateRoles("SET_ACADEMIC_STANDARDS"),
  AcademicController.createSubject
);
// router.post(
//   "/new_role_hierarchy",
//   AuthenticateRoles("IT_OPERATION"),
//   AcademicController.rolesHierarchyController
// );
// router.post(
//   "/new_role_permission",
//   AuthenticateRoles("IT_OPERATION"),
//   AcademicController.rolesPermissionController
// );
// router.post(
//   "/new_branch",
//   AuthenticateRoles("BRANCHING_AND_RECRUITMENT"),
//   AcademicController.BranchController
// );
// router.post(
//   "/new-school-mail",
//   AuthenticateRoles("IT_OPERATION"),
//   AcademicController.schoolMailController
// );
// // router.post("/new-staff-code", AuxController.staffCodeController);
// router.post(
//   "/new-permission",
//   AuthenticateRoles("IT_OPERATION"),
//   AcademicController.permissionController
// );
router.put(
  "/update_assessment/:assessmentid",
  AuthenticateRoles("SET_ACADEMIC_STANDARDS"),
  AcademicController.updateAssessment_type
);
router.put(
  "/update_subject/:subjectid",
  AuthenticateRoles("SET_ACADEMIC_STANDARDS"),
  AcademicController.updateSubject
);
// router.put(
//   "/update-role/:roleid",
//   AuthenticateRoles("IT_OPERATION"),
//   AcademicController.updateRoleController
// );
// router.put(
//   "/update-school-mail/:mailid",
//   AuthenticateRoles("IT_OPERATION"),
//   AcademicController.updateSchoolMailController
// );
// router.put("/update_branch/:branchid", AuxController.updateBranchController);
// router.put(
//   "/update-permission/:permissionid",
//   AuthenticateRoles("IT_OPERATION"),
//   AcademicController.updatePermissionController
// );
// router.delete(
//   "/delete_role_hierarchy/:roleid/:paRole",
//   AuthenticateRoles("IT_OPERATION"),
//   AcademicController.deleteRolehierarachyController
// );
// router.delete(
//   "/delete_role_permission/:permid/:roleid",
//   AuthenticateRoles("IT_OPERATION"),
//   AcademicController.deleteRolePermissionController
// );

module.exports = router;
