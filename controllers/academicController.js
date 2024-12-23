const AcademicsFunction = require("../db_functions/academics");
const generateUUId = require("../post-functions/functions/generateUuid");
const checkId = require("../post-functions/functions/checksingleExistence");
const { StatusCodes } = require("http-status-codes");
const checkallExistence = require("../post-functions/functions/checkallExistence");
const { BadRequestError, DataError, NotFoundError } = require("../error");
const fetchallExistence = require("../post-functions/fetchallExistence");
const { connection } = require("../config/connection");
const updateData = require("../post-functions/updateData");
const checkoneExistence = require("../post-functions/functions/checkoneExistence");

const createAssessment_type = async (req, res, next) => {
  try {
    // Check if there is a current academic year already
    const currentSession = await fetchallExistence("academic_session", {
      current: "true",
    });

    const session_id = currentSession?.[0]?.session_id;
    const year = currentSession?.[0]?.session;

    // Generate a unique session ID
    const assessment_id = await generateUUId(
      "assessment_type",
      "assessment_id",
      "ASSESS_TYPE"
    );
    if (assessment_id === "failed to generate unique id after 10 attempts") {
      throw new Error("Failed to generate a unique assessment ID");
    }

    // Assign values to request body
    req.body = { ...req.body, assessment_id, session_id, year };

    //Proceed with session creation logic (commented out for now)
    const assessmentType = await AcademicsFunction.createAssessment(
      req.body,
      assessment_id
    );

    return res.status(StatusCodes.CREATED).json(assessmentType);
  } catch (error) {
    next(error);
  }
};
const createSubject = async (req, res, next) => {
  try {
    // Check if there is a current academic year already
    const currentSession = await fetchallExistence("academic_session", {
      current: "true",
    });

    const session_id = currentSession?.[0]?.session_id;
    const year = currentSession?.[0]?.session;

    // Generate a unique session ID
    const subject_id = await generateUUId("subjects", "subject_id", "SUBJECT");
    if (subject_id === "failed to generate unique id after 10 attempts") {
      throw new Error("Failed to generate a unique subject ID");
    }

    // Assign values to request body
    req.body = { ...req.body, subject_id, session_id, year };

    //Proceed with session creation logic (commented out for now)
    const subject = await AcademicsFunction.createSubject(req.body, subject_id);

    return res.status(StatusCodes.CREATED).json(subject);
  } catch (error) {
    next(error);
  }
};
const updateAssessment_type = async (req, res, next) => {
  const { assessmentid: assessment_id } = req.params;

  const idPresent = await checkoneExistence(
    "assessment_type",
    "assessment_id",
    assessment_id
  );
  try {
    if (!idPresent) {
      return next(
        new BadRequestError(
          `assessment with id: ${assessment_id} doesn't exist.`
        )
      );
    }

    //Proceed with session creation logic (commented out for now)
    const assessmentType = await AcademicsFunction.updateAssessment(
      req.body,
      assessment_id
    );

    return res.status(StatusCodes.CREATED).json(assessmentType);
  } catch (error) {
    next(error);
  }
};
const updateSubject = async (req, res, next) => {
  const { subjectid: subject_id } = req.params;

  const idPresent = await checkoneExistence(
    "subjects",
    "subject_id",
    subject_id
  );
  try {
    if (!idPresent) {
      return next(
        new BadRequestError(`subject with id: ${subject_id} doesn't exist.`)
      );
    }

    //Proceed with session creation logic (commented out for now)
    const assessmentType = await AcademicsFunction.updateSubject(
      req.body,
      subject_id
    );

    return res.status(StatusCodes.CREATED).json(assessmentType);
  } catch (error) {
    next(error);
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

module.exports = {
  createAssessment_type,
  createSubject,
  updateSubject,
  updateAssessment_type,
  updateSession,
};
