const TermFunction = require("../db_functions/terms");
const generateUUId = require("../post-functions/functions/generateUuid");
const checkId = require("../post-functions/functions/checksingleExistence");
const { StatusCodes } = require("http-status-codes");
const {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
} = require("../error");
const checkoneExistence = require("../post-functions/functions/checkoneExistence");
const checkallDBExistence = require("../post-functions/branchDB/checkallDBExistence");
const fetchallExistence = require("../post-functions/fetchallExistence");
const { masterPool, getBranchPool } = require("../config/connection");
const FetchSinglemainDB = require("../post-functions/branchDB/fetchSinglemainDB");
const {
  commitTransaction,
  rollbackTransaction,
  beginTransaction,
} = require("../post-functions/functions/dbTransactionHelper");
const { FetchDataByIds } = require("../post-functions/fetchMultipleData");
const checkallExistence = require("../post-functions/functions/checkallExistence");

const createHalf = async (req, res, next) => {
  const { hqid } = req.params;

  const hqPool = req.branchPool;

  try {
    const isHQ = await checkallDBExistence(
      "branches",
      { branch_id: hqid, hq: "true" },
      "AND"
    );
    if (!isHQ) {
      return next(new UnauthorizedError("invalid HQ access"));
    }

    const half_id = await generateUUId("halves", "half_id", "HALF", hqPool);

    const [[currentSession]] = await Promise.all([
      fetchallExistence(
        "academic_session",
        {
          current: "true",
        },
        masterPool
      ),
    ]);

    if (!currentSession) {
      return next(
        new NotFoundError("sorry, no current year set, please contact support")
      );
    }

    if (
      !half_id ||
      half_id === "failed to generate unique id after 10 attempts"
    ) {
      return next(
        new BadRequestError(
          "Failed to generate a unique staff ID. Please try again."
        )
      );
    }

    const year = currentSession.session;
    const session_id = currentSession.session_id;

    req.body = {
      ...req.body,
      half_id,
      year,
      session_id,
    };

    const halfProp = await TermFunction.createHalf(req.body, half_id, hqPool);

    return res.status(StatusCodes.CREATED).json(halfProp);
  } catch (error) {
    return next(error);
  }
};
const createTerm = async (req, res, next) => {
  const { hqid } = req.params;

  const hqPool = req.branchPool;

  try {
    const isHQ = await checkallDBExistence(
      "branches",
      { branch_id: hqid, hq: "true" },
      "AND"
    );
    if (!isHQ) {
      return next(new UnauthorizedError("invalid HQ access"));
    }

    const term_id = await generateUUId("terms", "term_id", "TERM", hqPool);

    const [[currentSession]] = await Promise.all([
      fetchallExistence(
        "academic_session",
        {
          current: "true",
        },
        hqPool
      ),
    ]);

    if (!currentSession) {
      return next(
        new NotFoundError("sorry, no current year set, please contact support")
      );
    }

    if (
      !term_id ||
      term_id === "failed to generate unique id after 10 attempts"
    ) {
      return next(
        new BadRequestError(
          "Failed to generate a unique staff ID. Please try again."
        )
      );
    }

    const year = currentSession.session;
    const session_id = currentSession.session_id;

    req.body = {
      ...req.body,
      term_id,
      year,
      session_id,
    };

    const termProp = await TermFunction.create(req.body, term_id, hqPool);

    return res.status(StatusCodes.CREATED).json(termProp);
  } catch (error) {
    return next(error);
  }
};
const updateHalf = async (req, res, next) => {
  const { hqid, halfid: half_id } = req.params;

  const hqPool = req.branchPool;

  try {
    const isHQ = await checkallDBExistence(
      "branches",
      { branch_id: hqid, hq: "true" },
      "AND"
    );
    if (!isHQ) {
      return next(new UnauthorizedError("invalid HQ access"));
    }

    const idPresent = await checkoneExistence(
      "halves",
      "half_id",
      half_id,
      hqPool
    );

    if (!idPresent) {
      return next(
        new BadRequestError(`half with id: ${half_id} doesn't exist.`)
      );
    }
    const halfId = await TermFunction.updateHalf(req.body, half_id, hqPool);
    // console.log(userId);
    res.status(StatusCodes.CREATED).json({ halfId });
  } catch (error) {
    return next(error);
  }
};
const updateTerm = async (req, res, next) => {
  const { hqid, termid: term_id } = req.params;

  const hqPool = req.branchPool;

  try {
    const isHQ = await checkallDBExistence(
      "branches",
      { branch_id: hqid, hq: "true" },
      "AND"
    );
    if (!isHQ) {
      return next(new UnauthorizedError("invalid HQ access"));
    }

    const idPresent = await checkoneExistence(
      "terms",
      "term_id",
      term_id,
      hqPool
    );

    if (!idPresent) {
      return next(
        new BadRequestError(`term with id: ${term_id} doesn't exist.`)
      );
    }
    const termId = await TermFunction.update(req.body, term_id, hqPool);
    // console.log(userId);
    res.status(StatusCodes.CREATED).json({ termId });
  } catch (error) {
    return next(error);
  }
};
const syncHalf = async (req, res, next) => {
  const { hqid, branchid: branch_id } = req.params;
  const { half_id } = req.body;

  const branchPool = req.branchPool;

  let branchConnection, hqConnection, hqPool;

  branchConnection = await beginTransaction(branchPool);

  try {
    const isHQ = await checkallDBExistence(
      "branches",
      { branch_id: hqid, hq: "true" },
      "AND"
    );

    if (!isHQ) {
      return next(new UnauthorizedError("invalid HQ access"));
    }

    hqPool = await getBranchPool(hqid);
    hqConnection = await beginTransaction(hqPool);

    const isBranch = await checkallExistence(
      "branch",
      { branch_id },
      "AND",
      branchConnection
    );

    if (!isBranch) {
      return next(
        new UnauthorizedError(
          `branch with id: ${branch_id} not found in mainDB.`
        )
      );
    }

    const fetchData = await FetchDataByIds(
      "halves",
      "half_id",
      half_id,
      hqConnection
    );

    //Proceed with session creation logic (commented out for now)

    const data = fetchData.map((item) => ({
      ...item,
      branch_id,
    }));

    const copyData = await TermFunction.createMultipleHalves(
      data,
      branchConnection
    );

    await commitTransaction(branchConnection);
    await commitTransaction(hqConnection);

    return res.status(StatusCodes.CREATED).json(copyData);
  } catch (error) {
    next(error);
  }
};
const syncTerm = async (req, res, next) => {
  const { hqid, branchid: branch_id } = req.params;
  const { term_id } = req.body;

  const branchPool = req.branchPool;

  let branchConnection, hqConnection, hqPool;

  branchConnection = await beginTransaction(branchPool);

  try {
    const isHQ = await checkallDBExistence(
      "branches",
      { branch_id: hqid, hq: "true" },
      "AND"
    );

    if (!isHQ) {
      return next(new UnauthorizedError("invalid HQ access"));
    }

    hqPool = await getBranchPool(hqid);
    hqConnection = await beginTransaction(hqPool);

    const isBranch = await checkallExistence(
      "branch",
      { branch_id },
      "AND",
      branchConnection
    );

    if (!isBranch) {
      return next(
        new UnauthorizedError(
          `branch with id: ${branch_id} not found in mainDB.`
        )
      );
    }

    const fetchData = await FetchDataByIds(
      "terms",
      "term_id",
      term_id,
      hqConnection
    );

    //Proceed with session creation logic (commented out for now)

    const data = fetchData.map((item) => ({
      ...item,
      branch_id,
    }));

    const copyData = await TermFunction.createMultipleTerms(
      data,
      branchConnection
    );

    await commitTransaction(branchConnection);
    await commitTransaction(hqConnection);
    return res.status(StatusCodes.CREATED).json(copyData);
  } catch (error) {
    if (branchConnection) await rollbackTransaction(branchConnection);
    if (hqConnection) await rollbackTransaction(hqConnection);
    next(error);
  }
};

module.exports = {
  createTerm,
  updateTerm,
  createHalf,
  updateHalf,
  syncTerm,
  syncHalf,
};
