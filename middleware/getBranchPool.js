const { BadRequestError } = require("../error");
const { storeBranchPool } = require("../config/connection");

// middleware/withBranchId.js
const getBranchPools = async (req, res, next) => {
  console.log(req);
  const branchPool = await storeBranchPool();
  console.log(branchPool);
  const branchId = req.params.branchId;
  //   if (!branchId) {
  //     return next(new BadRequestError("Branch ID is required"));
  //   }
  //   req.branchId = branchId;
  next();
};

module.exports = getBranchPools;
