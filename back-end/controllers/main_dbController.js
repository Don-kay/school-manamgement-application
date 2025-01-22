const MainDBFunction = require("../db_functions/main_DB");
const generateUUId = require("../post-functions/functions/generateUuid");
const checkId = require("../post-functions/functions/checksingleExistence");
const { StatusCodes } = require("http-status-codes");
const checkoneDB = require("../post-functions/branchDB/checkoneDB");
const {
  BadRequestError,
  DataError,
  NotFoundError,
  UnauthorizedError,
  Success,
} = require("../error");
const { masterPool, getBranchPool } = require("../config/connection");
const updateData = require("../post-functions/updateData");
const checkallDBExistence = require("../post-functions/branchDB/checkallDBExistence");
const fetchallExistence = require("../post-functions/fetchallExistence");
const GenerateSchoolCode = require("../post-functions/functions/generateschoolCode");
const {
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
} = require("../post-functions/functions/dbTransactionHelper");
const {
  FilterAllowedFields,
} = require("../post-functions/functions/filterAllowedFields");
const checkallExistence = require("../post-functions/functions/checkallExistence");
const checkoneExistence = require("../post-functions/functions/checkoneExistence");

const getAcademicYear = (year) => {
  const startYear = parseInt(year, 10);
  const endYear = startYear + 1;
  return `${startYear}/${endYear}`;
};

const createBranchDB = async (req, res, next) => {
  const { hqid } = req.params;
  const { branch_name, db, alias } = req.body;
  let mainDBConnection, hqConnection;
  try {
    const branchId = req.branchId;
    if (branchId !== hqid) {
      throw next(
        new UnauthorizedError(
          "sorry, you do not have the neccessary permission to access this route"
        )
      );
    }

    const hqPool = await getBranchPool(hqid);

    mainDBConnection = await beginTransaction(masterPool);
    hqConnection = await beginTransaction(hqPool);

    const isHQ = await checkallDBExistence(
      "branches",
      { branch_id: hqid, hq: "true" },
      "AND"
    );

    if (!isHQ) {
      throw next(new UnauthorizedError("invalid HQ access"));
    }

    // Check if there is a current academic year already
    const branch_id = await generateUUId(
      "branches",
      "branch_id",
      "BRANCH",
      masterPool
    );

    const [data] = await fetchallExistence(
      "academic_session",
      {
        current: "true",
      },
      masterPool
    );

    if (!data) {
      throw next(
        new NotFoundError("sorry, no current year set, please contact support")
      );
    }

    const session_id = data.session_id;
    const year = data.session;

    if (
      branch_id === "failed to generate unique id after 10 attempts" ||
      !branch_id
    ) {
      throw next(
        new BadRequestError(
          "Failed to generate unique branch ID, please try again."
        )
      );
    }

    const code = await GenerateSchoolCode("branches", "code", masterPool);

    const branchExist = await checkallDBExistence(
      "branches",
      { branch_name, alias, db, code },
      "OR"
    );

    if (branchExist) {
      throw new DataError(
        `duplicate entries : values exist, please verify entries`
      );
    }

    await commitTransaction(mainDBConnection);
    await commitTransaction(hqConnection);

    req.body = { ...req.body, branch_id, code, year, session_id };

    //Proceed with session creation logic (commented out for now)
    const MainBranch = await MainDBFunction.storeDB(
      req.body,
      branch_id,
      mainDBConnection,
      hqConnection
    );

    return res.status(StatusCodes.CREATED).json(MainBranch);
  } catch (error) {
    if (hqConnection) await rollbackTransaction(hqConnection);
    if (mainDBConnection) await rollbackTransaction(mainDBConnection);
    next(error);
  }
};

const updateBranchDB = async (req, res, next) => {
  const { hqid, branchid: branch_id, alias } = req.params;
  const { db, hq } = req.body;

  const branchId = req.branchId;
  let mainDBConnection, hqConnection;
  const allowedFields = [
    "branch_name",
    "branch_host",
    "branch_user",
    "branch_passowrd",
    "branch_port",
    "db",
    "alias",
    "hq",
  ]; // Define allowed fields

  try {
    if (branchId !== hqid) {
      throw next(
        new UnauthorizedError(
          "sorry, you do not have the neccessary permission to access this route"
        )
      );
    }
    const hqPool = await getBranchPool(hqid);

    mainDBConnection = await beginTransaction(masterPool);
    hqConnection = await beginTransaction(hqPool);

    const filteredBody = FilterAllowedFields(req.body, allowedFields); // Filter req.body

    if (Object.keys(filteredBody).length === 0) {
      throw next(new DataError("No valid fields provided for update"));
    }

    const isHQ = await checkallDBExistence(
      "branches",
      { branch_id: hqid, hq: "true" },
      "AND"
    );

    if (!isHQ) {
      throw next(new UnauthorizedError("invalid HQ access"));
    }

    const branchExist = await checkallDBExistence(
      "branches",
      { branch_id, alias },
      "AND"
    );
    const dbExist = await checkoneDB("branches", { db }, "OR");

    if (!branchExist) {
      throw next(
        new BadRequestError(
          `branch you are trying to access doesn't exist.(${alias}, please verify and try again)`
        )
      );
    }
    if (!dbExist) {
      throw next(
        new BadRequestError(
          `${db} already in use, please verify and try again)`
        )
      );
    }

    // Fetch current session details if needed
    const isHq = hq === "true";
    const hqExist = await fetchallExistence(
      "branches",
      {
        hq: "true",
      },
      mainDBConnection
    );
    const hqId = hqExist?.[0]?.branch_id;

    // Determine if update to current session status is needed
    if (isHq && hqId === branch_id) {
      return next(new DataError("controller info :: No changes made"));
    } else if (!isHq && hqId === branch_id) {
      throw next(
        new BadRequestError(
          "unable to process request ::) unset current to false not possible, try setting a new branch as headquarter"
        )
      );
    } else if (isHq && hqId && hqId !== branch_id) {
      // Update the current session to false if a different session is to be marked as current
      const data = await updateData(
        "branches",
        { hq: "false" },
        "branch_id",
        hqId,
        mainDBConnection
      );
      const data2 = await updateData(
        "branch",
        { hq: "false" },
        "branch_id",
        hqId,
        hqConnection
      );
      if (!data || !data2 || Object.keys(data).length === 0) {
        throw new DataError("failed to update, try again later");
      }
      req.body.hq = "true";
    } else if (isHq && !hqId) {
      req.body.hq = "true";
    } else if (!isHq && !hqId) {
      throw next(new DataError("controller info :: No changes made"));
    }

    await commitTransaction(mainDBConnection);
    await commitTransaction(hqConnection);

    //Proceed with session creation logic (commented out for now)
    const branchDB = await MainDBFunction.updateDb(
      filteredBody,
      branch_id,
      mainDBConnection,
      hqConnection
    );

    return res.status(StatusCodes.CREATED).json(branchDB);
  } catch (error) {
    if (mainDBConnection) await rollbackTransaction(mainDBConnection);
    if (hqConnection) await rollbackTransaction(hqConnection);
    next(error);
  }
};

const syncBranchController = async (req, res, next) => {
  const { hqid, branchid: branch_id, alias } = req.params;

  const branchPool = await getBranchPool(branch_id);
  const hqPool = await getBranchPool(hqid);

  let branchConnection, hqConnection;

  hqConnection = await beginTransaction(hqPool);
  branchConnection = await beginTransaction(branchPool);
  // mainDBConnection = await beginTransaction(masterPool);

  try {
    const isHQ = await checkallDBExistence(
      "branches",
      { branch_id: hqid, hq: "true" },
      "AND"
    );
    if (!isHQ) {
      throw next(new UnauthorizedError("invalid HQ access"));
    }
    const branchExist = await checkallDBExistence(
      "branches",
      { branch_id, alias },
      "AND"
    );
    if (!branchExist) {
      throw next(
        new UnauthorizedError(
          `branch with data ${alias} & ${branch_id} doesn't exist`
        )
      );
    }

    const branch = await fetchallExistence(
      "branch",
      {
        branch_id,
        alias,
      },
      hqConnection
    );

    if (!branch) {
      throw next(
        new NotFoundError(
          "invalid request ::) Branch with request combination not found Head-quarter, ensure branches are properly synced from database storage."
        )
      );
    }

    const branchSynced = await fetchallExistence(
      "branch",
      {
        branch_id,
        alias,
      },
      branchConnection
    );

    if (branchSynced) {
      throw next(
        new Success(
          "branch information already synced. Seek to update necessary information if needed"
        )
      );
    }
    const fetchedBranch = branch[0];

    const syncBranch = await MainDBFunction.syncBranch(
      fetchedBranch,
      branch_id,
      branchConnection
    );

    await commitTransaction(branchConnection);
    await commitTransaction(hqConnection);
    // console.log(userId);
    return res.status(StatusCodes.OK).json({ syncBranch });
  } catch (error) {
    if (branchConnection) await rollbackTransaction(branchConnection);
    if (hqConnection) await rollbackTransaction(hqConnection);
    next(error);
  }
};
const createSession = async (req, res, next) => {
  const { hqid } = req.params;
  const { session, current } = req.body;

  const branchId = req.branchId;
  let mainDBConnection, hqConnection;

  try {
    if (branchId !== hqid) {
      throw next(
        new UnauthorizedError(
          "sorry, you do not have the neccessary permission to access this route"
        )
      );
    }

    const hqPool = await getBranchPool(hqid);

    mainDBConnection = await beginTransaction(masterPool);
    hqConnection = await beginTransaction(hqPool);

    const isHQ = await checkallDBExistence(
      "branches",
      { branch_id: hqid, hq: "true" },
      "AND"
    );

    if (!isHQ) {
      throw next(new UnauthorizedError("invalid HQ access"));
    }

    const isCurrent = current === "true";
    const query = `SELECT MAX(session) AS most_recent_year FROM academic_session`;

    const [data] = await mainDBConnection.query(query);

    if (!data || data?.length === 0) {
      throw next(new NotFoundError("no recent year found"));
    }
    const recentYear = data?.[0]?.most_recent_year;

    if (recentYear >= session) {
      throw next(new BadRequestError("unable to process request, year exist"));
    }

    // Check if there is a current academic year already
    const existingCurrentSession = await fetchallExistence(
      "academic_session",
      {
        current: "true",
      },
      mainDBConnection
    );
    const existinghqCurrentSession = await fetchallExistence(
      "academic_session",
      {
        current: "true",
      },
      hqConnection
    );

    const currentSessionId = existingCurrentSession?.[0]?.session_id;
    const currenthqSessionId = existinghqCurrentSession?.[0]?.session_id;

    if (isCurrent && currentSessionId) {
      const data = await updateData(
        "academic_session",
        { current: "false" },
        "session_id",
        currentSessionId,
        mainDBConnection
      );
      if (currenthqSessionId) {
        const hqData = await updateData(
          "academic_session",
          { current: "false" },
          "session_id",
          currentSessionId,
          hqConnection
        );
        if (!hqData || Object.keys(hqData).length === 0) {
          throw new DataError("failed to update, try again later");
        }
      }

      if (!data || Object.keys(data).length === 0) {
        throw new DataError("failed to update, try again later");
      }

      // Set the current flag appropriately
      req.body.current = "true";
    } else if (!isCurrent && !currentSessionId) {
      req.body.current = "true";
    }

    // Generate academic year string
    const academicYearString = getAcademicYear(session);

    // Generate a unique session ID
    const sessionId = await generateUUId(
      "academic_session",
      "session_id",
      "SESSION",
      mainDBConnection
    );
    if (sessionId === "failed to generate unique id after 10 attempts") {
      throw new Error("Failed to generate a unique session ID");
    }

    // Assign values to request body
    req.body.session_id = sessionId;
    req.body.academic_year = academicYearString;

    // Proceed with session creation logic (commented out for now)
    const sessionDetails = await MainDBFunction.createSession(
      req.body,
      sessionId,
      currentSessionId,
      mainDBConnection,
      hqConnection
    );

    await commitTransaction(mainDBConnection);
    await commitTransaction(hqConnection);

    return res.status(StatusCodes.CREATED).json(sessionDetails);
  } catch (error) {
    if (mainDBConnection) await rollbackTransaction(mainDBConnection);
    if (hqConnection) await rollbackTransaction(hqConnection);
    next(error);
  }
};
const updateSession = async (req, res, next) => {
  const { hqid, sessionid: session_id } = req.params;
  const { current } = req.body;

  const branchId = req.branchId;

  let mainDBConnection, hqConnection;

  try {
    if (branchId !== hqid) {
      throw next(
        new UnauthorizedError(
          "sorry, you do not have the neccessary permission to access this route"
        )
      );
    }

    const hqPool = await getBranchPool(hqid);

    mainDBConnection = await beginTransaction(masterPool);
    hqConnection = await beginTransaction(hqPool);

    const isHQ = await checkallDBExistence(
      "branches",
      { branch_id: hqid, hq: "true" },
      "AND"
    );

    if (!isHQ) {
      throw next(new UnauthorizedError("invalid HQ access"));
    }

    // Check if the session exists
    const sessionExists = await checkoneExistence(
      "academic_session",
      "session_id",
      session_id,
      mainDBConnection
    );
    if (!sessionExists) {
      throw next(
        new BadRequestError(
          `Failed to update, Session with id: ${session_id} doesn't exist`
        )
      );
    }

    // Fetch current session details if needed
    const isCurrentSession = current === "true";
    const existingCurrentSession = await fetchallExistence(
      "academic_session",
      {
        current: "true",
      },
      mainDBConnection
    );
    const existinghqCurrentSession = await fetchallExistence(
      "academic_session",
      {
        current: "true",
      },
      hqConnection
    );
    const currentSessionId = existingCurrentSession?.[0]?.session_id;
    const currenthqSessionId = existinghqCurrentSession?.[0]?.session_id;

    // Determine if update to current session status is needed
    if (isCurrentSession && currentSessionId === session_id) {
      throw next(new DataError("controller info :: No changes made"));
    } else if (!isCurrentSession && currentSessionId === session_id) {
      throw next(
        new BadRequestError(
          "unable to process request ::) unset current to false not possible, try setting a new session as true"
        )
      );
    } else if (
      isCurrentSession &&
      currentSessionId &&
      currentSessionId !== session_id
    ) {
      // Update the current session to false if a different session is to be marked as current
      const data = await updateData(
        "academic_session",
        { current: "false" },
        "session_id",
        currentSessionId,
        mainDBConnection
      );
      if (!data || Object.keys(data).length === 0) {
        throw new DataError("failed to update, try again later");
      }
      if (currenthqSessionId) {
        const data = await updateData(
          "academic_session",
          { current: "false" },
          "session_id",
          currentSessionId,
          hqConnection
        );
        if (!data || Object.keys(data).length === 0) {
          throw new DataError("failed to update, try again later");
        }
      }
      req.body.current = "true";
    } else if (isCurrentSession && !currentSessionId) {
      req.body.current = "true";
    } else if (!isCurrentSession && !currentSessionId) {
      throw next(new DataError("controller info :: No changes made"));
    }

    // Update the session data
    const updatedSession = await MainDBFunction.updateSession(
      req.body,
      session_id,
      currentSessionId,
      mainDBConnection,
      hqConnection
    );

    await commitTransaction(mainDBConnection);
    await commitTransaction(hqConnection);

    return res.status(StatusCodes.OK).json({ updatedSession });
  } catch (error) {
    if (mainDBConnection) await rollbackTransaction(mainDBConnection);
    if (hqConnection) await rollbackTransaction(hqConnection);
    next(error); // Pass error to the next middleware (error handling middleware)
  }
};
const syncCurrentSession = async (req, res, next) => {
  const { hqid, branchid: branch_id, alias } = req.params;

  const branchPool = await getBranchPool(branch_id);
  const hqPool = await getBranchPool(hqid);

  let branchConnection, hqConnection;

  hqConnection = await beginTransaction(hqPool);
  branchConnection = await beginTransaction(branchPool);
  try {
    const isHQ = await checkallDBExistence(
      "branches",
      { branch_id: hqid, hq: "true" },
      "AND"
    );
    if (!isHQ) {
      throw next(new UnauthorizedError("invalid HQ access"));
    }

    const branchExist = await checkallDBExistence(
      "branches",
      { branch_id, alias },
      "AND"
    );
    if (!branchExist) {
      throw next(
        new UnauthorizedError(
          `branch with data ${alias} & ${branch_id} doesn't exist`
        )
      );
    }
    const existingCurrentSession = await fetchallExistence(
      "academic_session",
      {
        current: "true",
      },
      hqConnection
    );
    if (!existingCurrentSession) {
      throw next(
        new NotFoundError(
          "invalid request ::) session with request combination not found in Head-quarter, ensure branches are properly synced from database storage."
        )
      );
    }

    const currentSessionId = existingCurrentSession?.[0]?.session_id;

    const session = await checkallExistence(
      "academic_session",
      {
        session_id: currentSessionId,
        current: "true",
      },
      "AND",
      branchConnection
    );

    if (session) {
      throw next(
        new Success(
          "current session information already synced. Seek to update necessary information if needed."
        )
      );
    }

    const currentSession = existingCurrentSession[0];

    //Proceed with session creation logic (commented out for now)

    const academicYear = await MainDBFunction.syncCurrentSession(
      currentSession,
      branchConnection,
      currentSessionId
    );

    await commitTransaction(branchConnection);

    return res.status(StatusCodes.CREATED).json(academicYear);
  } catch (error) {
    if (branchConnection) await rollbackTransaction(branchConnection);
    next(error);
  }
};
const syncBranchCurrentSession = async (req, res, next) => {
  const { hqid, branchid: branchId, alias } = req.params;

  const branchPool = await getBranchPool(branchId);
  const hqPool = await getBranchPool(hqid);

  const hqConnection = await beginTransaction(hqPool);
  const branchConnection = await beginTransaction(branchPool);

  try {
    // Validate HQ and branch existence
    const isHQ = await checkallDBExistence(
      "branches",
      { branch_id: hqid, hq: "true" },
      "AND"
    );
    if (!isHQ) throw new UnauthorizedError("Invalid HQ access");

    const branchExists = await checkallDBExistence(
      "branches",
      { branch_id: branchId, alias },
      "AND"
    );
    if (!branchExists) {
      throw new UnauthorizedError(
        `Branch with alias '${alias}' and ID '${branchId}' doesn't exist`
      );
    }

    // Fetch current sessions
    const [hqSession] =
      (await fetchallExistence(
        "academic_session",
        { current: "true" },
        hqConnection
      )) || [];
    const [branchSession] =
      (await fetchallExistence(
        "academic_session",
        { current: "true" },
        branchConnection
      )) || [];

    if (!hqSession) {
      throw new NotFoundError(
        "No active session found in HQ. Ensure sessions are properly synced from the database."
      );
    }

    if (!branchSession) {
      throw new NotFoundError(
        "No active session found in the branch. Ensure sessions are properly synced from the database."
      );
    }

    const { session_id: hqSessionId } = hqSession;
    const { session_id: branchSessionId } = branchSession;

    // Sync sessions if IDs mismatch
    if (hqSessionId !== branchSessionId) {
      const updateResult = await updateData(
        "academic_session",
        { current: "false" },
        "session_id",
        branchSessionId,
        branchConnection
      );

      if (!updateResult || Object.keys(updateResult).length === 0) {
        throw new DataError(
          "Failed to update session. Please try again later."
        );
      }
    }

    // Check if HQ session exists in the branch
    const sessionExists = !!(await checkoneExistence(
      "academic_session",
      "session_id",
      hqSessionId,
      branchConnection
    ));

    // Update branch session
    const academicYear = await MainDBFunction.branchUpdateSession(
      hqSession,
      hqSessionId,
      sessionExists,
      branchConnection
    );

    // Commit transactions
    await commitTransaction(branchConnection);
    await commitTransaction(hqConnection);

    return res.status(StatusCodes.CREATED).json(academicYear);
  } catch (error) {
    if (branchConnection) await rollbackTransaction(branchConnection);
    if (hqConnection) await rollbackTransaction(hqConnection);

    // Pass errors to the next middleware
    next(error);
  }
};
const assignStaffToBranch = async (req, res, next) => {
  const { hqid, branchid: branch_id, alias } = req.params;
  const { staff_id } = req.body;

  const branchPool = await getBranchPool(branch_id);
  const hqPool = await getBranchPool(hqid);

  let branchConnection, hqConnection;

  hqConnection = await beginTransaction(hqPool);
  branchConnection = await beginTransaction(branchPool);
  // mainDBConnection = await beginTransaction(masterPool);
  try {
    const isHQ = await checkallDBExistence(
      "branches",
      { branch_id: hqid, hq: "true" },
      "AND"
    );
    if (!isHQ) {
      throw next(new UnauthorizedError("invalid HQ access"));
    }

    const branchExist = await checkallDBExistence(
      "branches",
      { branch_id, alias },
      "AND"
    );
    if (!branchExist) {
      throw next(
        new NotFoundError(
          `branch with data ${alias} & ${branch_id} doesn't exist`
        )
      );
    }
    const staffExist = await checkoneExistence(
      "staff",
      "staff_id",
      staff_id,
      hqPool
    );
    if (!staffExist) {
      throw next(new NotFoundError(`staff with ${staff_id} doesn't exist`));
    }

    const staffToBranch = await MainDBFunction.assignstaffToBranch(
      staff_id,
      branch_id,
      hqid
    );

    // Respond with success
    return res.status(StatusCodes.CREATED).json({ staffToBranch });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createBranchDB,
  updateBranchDB,
  syncBranchController,
  createSession,
  updateSession,
  syncCurrentSession,
  syncBranchCurrentSession,
  assignStaffToBranch,
};
