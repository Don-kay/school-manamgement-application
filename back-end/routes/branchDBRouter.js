// routes/branchRouter.js
const express = require("express");
const branchRouter = express.Router();
const dbController = require("../controllers/main_dbController");

branchRouter.post("/storeDB_branch/:hqid", dbController.createBranchDB);
branchRouter.post(
  "/post-branch/:hqid/:alias/:branchid",
  // AuthenticateRoles("BRANCHING_AND_RECRUITMENT"),
  dbController.syncBranchController
);
branchRouter.put(
  "/updateDB_branch/:hqid/:alias/:branchid",
  dbController.updateBranchDB
);
branchRouter.post("/new_session/:hqid", dbController.createSession);
branchRouter.put(
  "/update_session/:hqid/:sessionid",
  dbController.updateSession
);
branchRouter.post(
  "/sync-current-session/:hqid/:alias/:branchid",
  // AuthenticateRoles("SET_ACADEMIC_STANDARDS"),
  dbController.syncCurrentSession
);
branchRouter.post(
  "/sync-current-session/branches/:hqid/:alias/:branchid",
  // AuthenticateRoles("SET_ACADEMIC_STANDARDS"),
  dbController.syncBranchCurrentSession
);

branchRouter.put(
  "/staff-to-branch/:hqid/:alias/:branchid",
  // AuthenticateRoles("BRANCHING_AND_RECRUITMENT"),
  dbController.assignStaffToBranch
);

module.exports = branchRouter;
