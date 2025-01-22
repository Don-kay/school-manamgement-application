const LevelFunction = require("../db_functions/year_level");
const { StatusCodes } = require("http-status-codes");
const checkId = require("../post-functions/functions/checksingleExistence");
const generateUUId = require("../post-functions/functions/generateUuid");
const {
  BadRequestError,
  NotFoundError,
  DataError,
  UnauthorizedError,
} = require("../error");
const ValidateEntityExistence = require("../post-functions/functions/validateEntityExistence");
const checkoneExistence = require("../post-functions/functions/checkoneExistence");
const checkallExistence = require("../post-functions/functions/checkallExistence");
const fetchallExistence = require("../post-functions/fetchallExistence");
const checkallDBExistence = require("../post-functions/branchDB/checkallDBExistence");
const { masterPool, getBranchPool } = require("../config/connection");
const YearLevel = require("../db_functions/year_level");
const {
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
} = require("../post-functions/functions/dbTransactionHelper");
const { FetchDataByIds } = require("../post-functions/fetchMultipleData");
// const checkuuId = require("../post-functions/functions/checkUuid");

const createYearLevel = async (req, res, next) => {
  const { hqid } = req.params;
  const { section_id, year_level } = req.body;

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

    const levelId = await generateUUId(
      "year_level",
      "level_id",
      "LEVEL",
      hqPool
    );
    if (
      !levelId ||
      levelId === "failed to generate unique id after 10 attempts"
    ) {
      return next(
        new BadRequestError(
          "Failed to generate a unique year level ID. Please try again."
        )
      );
    }

    const [resp, [sessionData], LevelId, levelName] = await Promise.all([
      checkoneExistence("sections", "section_id", section_id, hqPool),
      fetchallExistence("academic_session", { current: "true" }, masterPool),
      checkallExistence(
        "year_level",
        { level_id: levelId, section_id },
        "AND",
        hqPool
      ),
      checkoneExistence("year_level", "year_level", year_level, hqPool),
    ]);

    if (!resp) {
      throw new DataError(
        "Invalid section information. Please verify and try again."
      );
    }

    if (!sessionData) {
      return next(
        new NotFoundError(
          "No current academic session found. Please contact support."
        )
      );
    }

    if (LevelId || levelName) {
      return next(
        new DataError(
          "Year level exists, Please verify your details and try again."
        )
      );
    }

    const { session_id, session: year } = sessionData;

    req.body = { ...req.body, level_id: levelId, session_id, year };

    const levelProp = await LevelFunction.create(req.body, levelId, hqPool);
    res.status(StatusCodes.CREATED).json({ levelProp });
  } catch (error) {
    next(error);
  }
};

const createClassType = async (req, res, next) => {
  const { hqid } = req.params;
  const { class_type } = req.body;

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

    const class_id = await generateUUId(
      "class_type",
      "class_id",
      "CLASS",
      hqPool
    );
    if (
      !class_id ||
      class_id === "failed to generate unique id after 10 attempts"
    ) {
      return next(
        new BadRequestError(
          "Failed to generate a unique class type ID. Please try again."
        )
      );
    }

    const [[sessionData], classExist] = await Promise.all([
      fetchallExistence("academic_session", { current: "true" }, masterPool),
      checkallExistence("class_type", { class_type, class_id }, "OR", hqPool),
    ]);

    if (!sessionData) {
      return next(
        new NotFoundError(
          "No current academic session found. Please contact support."
        )
      );
    }

    if (classExist) {
      return next(
        new NotFoundError(
          `class_type: ( ${class_type} ) exists, please input a new value.`
        )
      );
    }

    const { session_id, session: year } = sessionData;

    req.body = { ...req.body, class_id, session_id, year };

    const classProp = await LevelFunction.createClassType(req.body, hqPool);
    return res.status(StatusCodes.CREATED).json({ classProp });
  } catch (error) {
    // console.log(error);
    next(error);
  }
};
const updateYearLevel = async (req, res, next) => {
  const { hqid, levelid: level_id } = req.params;
  const { section_id, year_level } = req.body;

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

    // Check if the year level exists
    const yearLevelExists = await checkoneExistence(
      "year_level",
      "level_id",
      level_id,
      hqPool
    );

    const LevelName = await checkoneExistence(
      "year_level",
      "year_level",
      year_level,
      hqPool
    );

    if (!yearLevelExists) {
      throw new DataError(
        "Year level information is not available or invalid. Please verify and try again."
      );
    }

    if (LevelName) {
      return next(
        new DataError("Year level name exists, input a new name and try again.")
      );
    }

    // Validate and section_id if provide.

    if (section_id) {
      await ValidateEntityExistence(
        "sections",
        "section_id",
        section_id,
        { level_id, section_id },
        "Section already linked to year level",
        "year_level",
        "AND",
        hqPool
      );
    }

    // Update the year level
    const updatedLevelId = await LevelFunction.update(
      req.body,
      level_id,
      hqPool
    );

    return res.status(StatusCodes.OK).json({ updatedLevelId });
  } catch (error) {
    next(error);
  }
};
const updateClassType = async (req, res, next) => {
  const { hqid, classid: class_id } = req.params;
  const { class_type } = req.body;

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

    const [classid, classExist] = await Promise.all([
      checkoneExistence("class_type", "class_id", class_id, hqPool),
      checkoneExistence("class_type", "class_type", class_type, hqPool),
    ]);

    if (!classid) {
      return next(
        new DataError(
          "invalid class id, class id doesnt exist, Please verify your details and try again."
        )
      );
    }

    if (classExist) {
      return next(
        new NotFoundError(
          `class_type: ( ${class_type} ) exists, please input a new value.`
        )
      );
    }

    const classId = await LevelFunction.updateClassType(
      req.body,
      class_id,
      hqPool
    );
    // console.log(userId);
    return res.status(StatusCodes.OK).json({ classId });
  } catch (error) {
    next(error);
  }
};
const syncYearLevel = async (req, res, next) => {
  const { hqid, branchid: branch_id } = req.params;
  const { level_id } = req.body;

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
      "year_level",
      "level_id",
      level_id,
      hqConnection
    );

    //Proceed with session creation logic (commented out for now)

    const data = fetchData.map((item) => ({
      ...item,
      branch_id,
    }));

    const copyData = await LevelFunction.createMultipleYearLevel(
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
const syncClassType = async (req, res, next) => {
  const { hqid, branchid: branch_id } = req.params;
  const { class_id } = req.body;

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
      "class_type",
      "class_id",
      class_id,
      hqConnection
    );

    //Proceed with session creation logic (commented out for now)

    const data = fetchData.map((item) => ({
      ...item,
      branch_id,
    }));

    const copyData = await LevelFunction.createMultipleClassType(
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
  createYearLevel,
  createClassType,
  updateYearLevel,
  updateClassType,
  syncClassType,
  syncYearLevel,
};
