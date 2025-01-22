const express = require("express");
const AcademicController = require("../controllers/academicController");
const AuthenticateRoles = require("../middleware/AuthenticateRoles");
const router = express.Router();

router.post(
  "/input-score/:branchid/:termid/:levelid/:classid/:subjectid/:halfid",
  // AuthenticateRoles("SET_ACADEMIC_STANDARDS"),
  AcademicController.inputSCores
);
router.post(
  "/update-score/:branchid/:scoreid/:termid/:levelid/:classid/:subjectid/:halfid",
  // AuthenticateRoles("SET_ACADEMIC_STANDARDS"),
  AcademicController.updateSCores
);
router.post(
  "/new-assessment/:hqid",
  // AuthenticateRoles("SET_ACADEMIC_STANDARDS"),
  AcademicController.createAssessment_type
);
router.post(
  "/new-subject/:hqid",
  // AuthenticateRoles("SET_ACADEMIC_STANDARDS"),
  AcademicController.createSubject
);
router.post(
  "/sync-subject/:branchid/:hqid",
  // AuthenticateRoles("SET_ACADEMIC_STANDARDS"),
  AcademicController.syncSubject
);
router.post(
  "/sync-assessment/:branchid/:hqid",
  // AuthenticateRoles("SET_ACADEMIC_STANDARDS"),
  AcademicController.syncAssessment
);
router.put(
  "/update-assessment/:hqid/:assessmentid",
  // AuthenticateRoles("SET_ACADEMIC_STANDARDS"),
  AcademicController.updateAssessment_type
);
router.put(
  "/update-subject/:hqid/:subjectid",
  // AuthenticateRoles("SET_ACADEMIC_STANDARDS"),
  AcademicController.updateSubject
);

module.exports = router;
