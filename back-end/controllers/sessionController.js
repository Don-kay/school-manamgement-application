const SessionFunction = require("../db_functions/sessions");
const generateUUId = require("../post-functions/functions/generateUuid");
const checkId = require("../post-functions/functions/checksingleExistence");
const { StatusCodes } = require("http-status-codes");
const checkallExistence = require("../post-functions/functions/checkallExistence");
const {
  BadRequestError,
  DataError,
  NotFoundError,
  UnauthorizedError,
} = require("../error");
const fetchallExistence = require("../post-functions/fetchallExistence");
const { masterPool } = require("../config/connection");
const updateData = require("../post-functions/updateData");
const checkoneExistence = require("../post-functions/functions/checkoneExistence");
const checkallDBExistence = require("../post-functions/branchDB/checkallDBExistence");
const {
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
} = require("../post-functions/functions/dbTransactionHelper");

const copySession = async (req, res, next) => {
  const { hqid } = req.params;
  const { session_id } = req.body;

  try {
    const isHQ = await checkallDBExistence(
      "branches",
      { branch_id: hqid, alias: "CSHQ" },
      "AND"
    );
    if (!isHQ) {
      return next(new UnauthorizedError("invalid HQ access"));
    }

    //Proceed with session creation logic (commented out for now)

    const copyData = await SessionFunction.copy(session_id, hqid);

    return res.status(StatusCodes.CREATED).json(copyData);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  copySession,
};
