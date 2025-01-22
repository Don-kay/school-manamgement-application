const AcademicsFunction = require("../db_functions/academics");
const generateUUId = require("../post-functions/functions/generateUuid");
const checkId = require("../post-functions/functions/checksingleExistence");
const { StatusCodes } = require("http-status-codes");
const checkallExistence = require("../post-functions/functions/checkallExistence");
const {
  BadRequestError,
  DataError,
  NotFoundError,
  UnauthorizedError,
  UnauthenticatedError,
} = require("../error");
const fetchallExistence = require("../post-functions/fetchallExistence");
const { masterPool, getBranchPool } = require("../config/connection");
const updateData = require("../post-functions/updateData");
const checkoneExistence = require("../post-functions/functions/checkoneExistence");
const checkallDBExistence = require("../post-functions/branchDB/checkallDBExistence");
const {
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
} = require("../post-functions/functions/dbTransactionHelper");
const { FetchDataByIds } = require("../post-functions/fetchMultipleData");

const inputSCores = async (req, res, next) => {
  const {
    branchid: branch_id,
    levelid: level_id,
    classid: class_id,
    termid: term_id,
    subjectid: subject_id,
    halfid: half_id,
  } = req.params;

  const { learner_id } = req.body;

  const branchPool = req.branchPool;

  let branchConnection;

  branchConnection = await beginTransaction(branchPool);

  try {
    // Check if there is a current academic year already
    const currentSession = await fetchallExistence(
      "academic_session",
      {
        current: "true",
      },
      branchPool
    );

    if (!currentSession) {
      return next(
        new NotFoundError("sorry, no current year set, please contact support")
      );
    }

    const session_id = currentSession?.[0]?.session_id;
    const year = currentSession?.[0]?.session;

    const learnerExist = await checkallExistence(
      "learners_class",
      { learner_id, level_id, class_id },
      "AND",
      branchPool
    );

    if (!learnerExist) {
      return next(
        new UnauthenticatedError(
          "failed to input score. Learner does not belong to this class."
        )
      );
    }

    const scoreExist = await checkallExistence(
      "scores",
      { subject_id, learner_id, half_id, level_id, class_id },
      "AND",
      branchPool
    );

    if (scoreExist) {
      return next(new DataError("learners score already exists."));
    }

    const [yearLevel, classType, terms, subjects, halves, branch] =
      await Promise.all([
        checkoneExistence("year_level", "level_id", level_id, branchPool),
        checkoneExistence("class_type", "class_id", class_id, branchPool),
        checkoneExistence("terms", "term_id", term_id, branchPool),
        checkoneExistence("subjects", "subject_id", subject_id, branchPool),
        checkoneExistence("halves", "half_id", half_id, branchPool),
        checkoneExistence("branch", "branch_id", branch_id, branchPool),
      ]);

    if (!yearLevel || !terms || !subjects || !halves || !branch || !classType) {
      return next(
        new DataError(`input value not correct. Verify and try again`)
      );
    }

    const classExist = await checkallExistence(
      "branch_classes",
      { level_id, class_id },
      "AND",
      branchPool
    );

    if (!classExist) {
      return next(new BadRequestError("sorry class does not exists."));
    }

    // Generate a unique session ID
    const score_id = await generateUUId(
      "scores",
      "score_id",
      "SCORE",
      branchConnection
    );
    if (
      score_id === "failed to generate unique id after 10 attempts" ||
      !score_id
    ) {
      return next(
        new BadRequestError(
          "Failed to generate unique code ID, please try again."
        )
      );
    }

    // Assign values to request body
    req.body = {
      ...req.body,
      term_id,
      score_id,
      half_id,
      subject_id,
      level_id,
      class_id,
      branch_id,
      session_id,
      year,
    };

    //Proceed with session creation logic (commented out for now)
    const assessmentType = await AcademicsFunction.inputScore(
      req.body,
      score_id,
      branchConnection
    );

    await commitTransaction(branchConnection);

    return res.status(StatusCodes.CREATED).json(assessmentType);
  } catch (error) {
    if (branchConnection) await rollbackTransaction(branchConnection);

    next(error);
  }
};
const updateSCores = async (req, res, next) => {
  const {
    scoreid: score_id,
    levelid: level_id,
    classid: class_id,
    termid: term_id,
    subjectid: subject_id,
    halfid: half_id,
    branchid: branch_id,
  } = req.params;

  const { learner_id, ...newObj } = req.body;

  const branchPool = req.branchPool;

  let branchConnection;

  branchConnection = await beginTransaction(branchPool);

  try {
    const scoreExist = await checkallExistence(
      "scores",
      {
        score_id,
        learner_id,
        half_id,
        level_id,
        class_id,
        subject_id,
        term_id,
      },
      "AND",
      branchPool
    );

    if (!scoreExist) {
      return next(new DataError(`score with id: ${score_id} does not exist.`));
    }

    const classExist = await checkallExistence(
      "branch_classes",
      { level_id, class_id },
      "AND",
      branchPool
    );

    if (!classExist) {
      return next(new BadRequestError("sorry class does not exists."));
    }

    const [
      yearLevel,
      classType,
      terms,
      subjects,
      halves,
      learnerExist,
      branch,
    ] = await Promise.all([
      checkoneExistence("year_level", "level_id", level_id, branchPool),
      checkoneExistence("class_type", "class_id", class_id, branchPool),
      checkoneExistence("terms", "term_id", term_id, branchPool),
      checkoneExistence("subjects", "subject_id", subject_id, branchPool),
      checkoneExistence("halves", "half_id", half_id, branchPool),
      checkoneExistence("branch", "branch_id", branch_id, branchPool),
      checkallExistence(
        "learners_class",
        { learner_id, level_id, class_id },
        "AND",
        branchPool
      ),
    ]);

    if (!yearLevel || !terms || !subjects || !halves || !branch || !classType) {
      return next(
        new DataError(`input value not correct. Verify and try again`)
      );
    }

    if (!learnerExist) {
      return next(
        new UnauthenticatedError(
          "failed to input score. Learner does not belong to this class."
        )
      );
    }

    //Proceed with session creation logic (commented out for now)
    const assessmentType = await AcademicsFunction.updateScore(
      newObj,
      score_id,
      branchConnection
    );

    await commitTransaction(branchConnection);

    return res.status(StatusCodes.CREATED).json(assessmentType);
  } catch (error) {
    if (branchConnection) await rollbackTransaction(branchConnection);

    next(error);
  }
};
const createAssessment_type = async (req, res, next) => {
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

    // Check if there is a current academic year already
    const currentSession = await fetchallExistence(
      "academic_session",
      {
        current: "true",
      },
      masterPool
    );

    if (!currentSession) {
      return next(
        new NotFoundError("sorry, no current year set, please contact support")
      );
    }

    const session_id = currentSession?.[0]?.session_id;
    const year = currentSession?.[0]?.session;

    // Generate a unique session ID
    const assessment_id = await generateUUId(
      "assessment_type",
      "assessment_id",
      "ASSESS_TYPE",
      hqPool
    );
    if (
      assessment_id === "failed to generate unique id after 10 attempts" ||
      !assessment_id
    ) {
      return next(
        new BadRequestError(
          "Failed to generate unique code ID, please try again."
        )
      );
    }

    // Assign values to request body
    req.body = { ...req.body, assessment_id, session_id, year };

    //Proceed with session creation logic (commented out for now)
    const assessmentType = await AcademicsFunction.createAssessment(
      req.body,
      assessment_id,
      hqPool
    );

    return res.status(StatusCodes.CREATED).json(assessmentType);
  } catch (error) {
    next(error);
  }
};
const createSubject = async (req, res, next) => {
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

    // Check if there is a current academic year already
    const currentSession = await fetchallExistence(
      "academic_session",
      {
        current: "true",
      },
      masterPool
    );

    if (!currentSession) {
      return next(
        new NotFoundError("sorry, no current year set, please contact support")
      );
    }

    const session_id = currentSession?.[0]?.session_id;
    const year = currentSession?.[0]?.session;

    // Generate a unique session ID
    const subject_id = await generateUUId(
      "subjects",
      "subject_id",
      "SUBJECT",
      hqPool
    );

    if (
      subject_id === "failed to generate unique id after 10 attempts" ||
      !subject_id
    ) {
      return next(
        new BadRequestError(
          "Failed to generate unique code ID, please try again."
        )
      );
    }

    // Assign values to request body
    req.body = { ...req.body, subject_id, session_id, year };

    //Proceed with session creation logic (commented out for now)
    const subject = await AcademicsFunction.createSubject(
      req.body,
      subject_id,
      hqPool
    );

    return res.status(StatusCodes.CREATED).json(subject);
  } catch (error) {
    next(error);
  }
};
const updateAssessment_type = async (req, res, next) => {
  const { hqid, assessmentid: assessment_id } = req.params;

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
      "assessment_type",
      "assessment_id",
      assessment_id,
      hqPool
    );

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
      assessment_id,
      hqPool
    );

    return res.status(StatusCodes.CREATED).json(assessmentType);
  } catch (error) {
    next(error);
  }
};
const updateSubject = async (req, res, next) => {
  const { hqid, subjectid: subject_id } = req.params;

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
      "subjects",
      "subject_id",
      subject_id,
      hqPool
    );

    if (!idPresent) {
      return next(
        new BadRequestError(`subject with id: ${subject_id} doesn't exist.`)
      );
    }

    //Proceed with session creation logic (commented out for now)
    const assessmentType = await AcademicsFunction.updateSubject(
      req.body,
      subject_id,
      hqPool
    );

    return res.status(StatusCodes.CREATED).json(assessmentType);
  } catch (error) {
    next(error);
  }
};
const syncSubject = async (req, res, next) => {
  const { hqid, branchid: branch_id } = req.params;
  const { subject_id } = req.body;

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
      "subjects",
      "subject_id",
      subject_id,
      hqConnection
    );

    //Proceed with session creation logic (commented out for now)

    const data = fetchData.map((item) => ({
      ...item,
      branch_id,
    }));

    const copyData = await AcademicsFunction.createMultipleSubject(
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
const syncAssessment = async (req, res, next) => {
  const { hqid, branchid: branch_id } = req.params;
  const { assessment_id } = req.body;

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
      "branches",
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
      "assessment_type",
      "assessment_id",
      assessment_id,
      hqConnection
    );

    //Proceed with session creation logic (commented out for now)

    const data = fetchData.map((item) => ({
      ...item,
      branch_id,
    }));

    const copyData = await AcademicsFunction.createMultipleAssessment(
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
  createAssessment_type,
  createSubject,
  updateSubject,
  updateAssessment_type,
  syncSubject,
  syncAssessment,
  inputSCores,
  updateSCores,
};
