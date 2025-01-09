// routes/branchRouter.js
const express = require("express");
const getBranchPoolware = require("../middleware/getBranchPoolware");
const branchRouter = express.Router();
const AuxController = require("../controllers/schoolAuxillieryController");

branchRouter.put(
  "/update_branch/:hqid/:alias/:branchid",
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
