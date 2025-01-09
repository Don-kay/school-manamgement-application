const { BadRequestError, UnauthorizedError } = require("../error");
const { getBranchPool } = require("../config/connection");

// middleware/withBranchId.js
const getBranchPoolsWare = async (req, res, next) => {
  try {
    const url = req.url;
    const branchId = req.branchId;

    const branchid = url.match(/([a-zA-Z0-9-]+\+BRANCH)/)[1];

    if (!branchId || !branchid) {
      return next(new BadRequestError("Branch ID is required"));
    }

    if (branchid !== branchId) {
      return next(
        new UnauthorizedError(
          "sorry, invalid access to route, verify your permissions and try again"
        )
      );
    }
    // console.log(typeof branchId);
    // Use the getBranchPool function to fetch the connection pool

    req.branchPool = await getBranchPool(branchId);
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    return next(error);
  }
};

module.exports = getBranchPoolsWare;
