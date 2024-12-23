// routes/branchRouter.js
const express = require("express");
const getBranchPool = require("../middleware/getBranchPool");
const branchRouter = express.Router();
const AuxController = require("../controllers/schoolAuxillieryController");
const dbController = require("../controllers/main_dbController");
const DatabaseManager = require("../config/connection");

branchRouter.post("/storeDB_branch", dbController.createBranchDB);

// Apply `withBranchId` middleware to all routes under this router
branchRouter.use(getBranchPool);

branchRouter.put(
  "/update_branch/:alias/:branchid",
  // AuthenticateRoles("BRANCHING_AND_RECRUITMENT"),
  AuxController.updateBranchController
);

// Example route using `branchId`
// branchRouter.get("/checkConnection", async (req, res) => {
//   try {
//     const connection = await DatabaseManager.checkConnection(req.branchId); // Use req.branchId
//     console.log(connection, { message: `Connected to branch ${req.branchId}` });
//   } catch (error) {
//     console.log({ error: "Connection error: " + error.message });
//   }
// });

// Add more branch-specific routes here...

module.exports = branchRouter;
