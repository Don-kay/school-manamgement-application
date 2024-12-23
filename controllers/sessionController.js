const SessionFunction = require("../db_functions/sessions");
const generateUUId = require("../post-functions/functions/generateUuid");
const checkId = require("../post-functions/functions/checksingleExistence");
const { StatusCodes } = require("http-status-codes");
const checkallExistence = require("../post-functions/functions/checkallExistence");
const { BadRequestError, DataError, NotFoundError } = require("../error");
const fetchallExistence = require("../post-functions/fetchallExistence");
const { connection } = require("../config/connection");
const updateData = require("../post-functions/updateData");
const checkoneExistence = require("../post-functions/functions/checkoneExistence");

const getAcademicYear = (year) => {
  const startYear = parseInt(year, 10);
  const endYear = startYear + 1;
  return `${startYear}/${endYear}`;
};
const createSession = async (req, res, next) => {
  const transactionConnect = await connection.getConnection();

  try {
    const { session, current } = req.body;

    await transactionConnect.beginTransaction();

    const isCurrent = current === "true";
    const query = `SELECT MAX(session) AS most_recent_year FROM academic_session`;

    const [data] = await connection.query(query);

    if (!data || data?.length === 0) {
      return next(new NotFoundError("no recent year found"));
    }
    const recentYear = data?.[0]?.most_recent_year;

    if (recentYear >= session) {
      return next(new BadRequestError("unable to process request, year exist"));
    }

    // Check if there is a current academic year already
    const existingCurrentSession = await fetchallExistence("academic_session", {
      current: "true",
    });

    const currentSessionId = existingCurrentSession?.[0]?.session_id;

    if (isCurrent && currentSessionId) {
      const data = await updateData(
        "academic_session",
        { current: "false" },
        "session_id",
        currentSessionId
      );
      if (!data || Object.keys(data).length === 0) {
        transactionConnect.rollback();
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
      "SESSION"
    );
    if (sessionId === "failed to generate unique id after 10 attempts") {
      throw new Error("Failed to generate a unique session ID");
    }

    // Assign values to request body
    req.body.session_id = sessionId;
    req.body.academic_year = academicYearString;

    // Proceed with session creation logic (commented out for now)
    const sessionDetails = await SessionFunction.create(
      req.body,
      sessionId,
      isCurrent,
      currentSessionId,
      transactionConnect
    );
    await transactionConnect.commit();
    return res.status(StatusCodes.CREATED).json(sessionDetails);
  } catch (error) {
    if (transactionConnect) await transactionConnect.rollback();
    next(error);
  } finally {
    if (transactionConnect) transactionConnect.release();
  }
};

const updateSession = async (req, res, next) => {
  const transactionConnect = await connection.getConnection();
  try {
    const { current } = req.body;
    const { sessionid: session_id } = req.params;

    await transactionConnect.beginTransaction();

    // Check if the session exists
    const sessionExists = await checkoneExistence(
      "academic_session",
      "session_id",
      session_id
    );
    if (!sessionExists) {
      await transactionConnect.rollback();
      return next(
        new BadRequestError(
          `Failed to update, Session with id: ${session_id} doesn't exist`
        )
      );
    }

    // Fetch current session details if needed
    const isCurrentSession = current === "true";
    const existingCurrentSession = await fetchallExistence("academic_session", {
      current: "true",
    });
    const currentSessionId = existingCurrentSession?.[0]?.session_id;

    // Determine if update to current session status is needed
    if (isCurrentSession && currentSessionId === session_id) {
      return next(new DataError("controller info :: No changes made"));
    } else if (!isCurrentSession && currentSessionId === session_id) {
      return next(
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
        currentSessionId
      );
      if (!data || Object.keys(data).length === 0) {
        transactionConnect.rollback();
        throw new DataError("failed to update, try again later");
      }
      req.body.current = "true";
    } else if (isCurrentSession && !currentSessionId) {
      req.body.current = "true";
    } else if (!isCurrentSession && !currentSessionId) {
      return next(new DataError("controller info :: No changes made"));
    }

    // Update the session data
    const updatedSession = await SessionFunction.update(
      req.body,
      session_id,
      transactionConnect,
      currentSessionId
    );

    await transactionConnect.commit();
    return res.status(StatusCodes.OK).json({ updatedSession });
  } catch (error) {
    if (transactionConnect) await transactionConnect.rollback();
    next(error); // Pass error to the next middleware (error handling middleware)
  } finally {
    if (transactionConnect) transactionConnect.release();
  }
};

module.exports = { createSession, updateSession };
