const LearnersFunction = require("../db_functions/learners");
const generateUUId = require("../post-functions/functions/generateUuid");
const checkId = require("../post-functions/functions/checksingleExistence");
const {
  DataError,
  NotFoundError,
  BadRequestError,
  Success,
} = require("../error");
const { StatusCodes } = require("http-status-codes");
const checkallExistence = require("../post-functions/functions/checkallExistence");
const fetchallExistence = require("../post-functions/fetchallExistence");
const GenerateCode = require("../post-functions/functions/generateCode");
const checkoneExistence = require("../post-functions/functions/checkoneExistence");
const FetchSingleData = require("../post-functions/fetchSingleInputedData");
const checkallDBExistence = require("../post-functions/branchDB/checkallDBExistence");
const {
  beginTransaction,
  rollbackTransaction,
  commitTransaction,
} = require("../post-functions/functions/dbTransactionHelper");
const { masterPool } = require("../config/connection");

const createLearner = async (req, res, next) => {
  const { alias, branchid: branch_id } = req.params;
  const { parent_id, dob, age } = req.body;

  const branchPool = req.branchPool;

  let branchConnection;

  branchConnection = await beginTransaction(branchPool);

  try {
    const learnerInputAge = dob.split("-")[0];
    const currentYear = new Date().getFullYear();
    const learnerAge = currentYear - learnerInputAge;

    const [branchExists, [currentSession], parent] = await Promise.all([
      checkallExistence(
        "branch",
        { branch_id, alias },
        "AND",
        branchConnection
      ),
      fetchallExistence(
        "academic_session",
        {
          current: "true",
        },
        masterPool
      ),
      FetchSingleData("parents", "parent_id", parent_id, branchConnection),
    ]);

    if (!currentSession) {
      return next(
        new NotFoundError("Current session not found. Please contact support")
      );
    }
    if (!branchExists) {
      return next(new NotFoundError("branch doesn't exist"));
    }

    if (age !== learnerAge) {
      return next(
        new BadRequestError("Invalid age, please verify and try again.")
      );
    }

    // Construct the ward's full name
    const ward = `${parent.title} ${parent.surname} ${parent.othernames} ${parent.firstname}`;

    // Check if the parent's nationality contains "Nigerian"
    const containsSubstring = parent.nationality
      .toLowerCase()
      .includes("nigerian");

    const learner_id = await generateUUId(
      "montessori_learners",
      "learner_id",
      "LEARNER",
      branchConnection
    );

    if (learner_id === "failed to generate unique id after 10 attempts") {
      throw new Error("Failed to generate a unique learner ID");
    }

    const session_id = currentSession?.session_id;
    const year = currentSession?.session;

    const prefix = `${alias}/${year}/`;

    const admission_number = await GenerateCode(
      "montessori_learners",
      "admission_number",
      prefix,
      branchConnection
    );
    //console.log(generateCode);

    req.body = {
      ...req.body,
      learner_id,
      admission_number,
      branch_id,
      personnel: "learner",
      session_id,
      year,
      ward,
      parent_id: parent.parent_id,
      surname: parent.surname,
      state_of_origin: containsSubstring ? parent.state_of_origin : "none",
    };

    const learnerId = await LearnersFunction.create(
      req.body,
      learner_id,
      branchConnection
    );

    await commitTransaction(branchConnection);
    return res.status(StatusCodes.CREATED).json({ learnerId });
  } catch (error) {
    if (branchConnection) await rollbackTransaction(branchConnection);
    // console.log(error);
    return next(error);
  }
};

const updateLearner = async (req, res, next) => {
  const { alias, branchid: branch_id, learnerid: learner_id } = req.params;
  const { parent_id } = req.body;

  const branchPool = req.branchPool;

  try {
    if (parent_id) {
      return next(new BadRequestError("cant update parent"));
    }

    const branchExists = await checkallExistence(
      "branch",
      { branch_id, alias },
      "AND",
      branchPool
    );

    if (!branchExists) {
      return next(new NotFoundError("branch doesn't exist"));
    }

    const idPresent = await checkoneExistence(
      "montessori_learners",
      "learner_id",
      learner_id,
      branchPool
    );

    if (!idPresent) {
      return next(
        new NotFoundError(`learner with id: ${learner_id} doesn't exist`)
      );
    }

    const learnerProp = await LearnersFunction.update(
      req.body,
      learner_id,
      branchPool
    );
    return res.status(StatusCodes.OK).json({ learnerProp });
  } catch (error) {
    // Proper error logging can be added here if needed, e.g., using a logging library
    return next(error);
  }
};

const delinkLearner = async (req, res, next) => {
  const { alias, branchid: branch_id, learnerid: learner_id } = req.params;
  const { parent_id } = req.body;

  const branchPool = req.branchPool;

  let branchConnection;

  branchConnection = await beginTransaction(branchPool);

  // Check if both learnerid and parent_id are provided
  if (!learner_id || !parent_id) {
    return next(new BadRequestError("Learner ID and Parent ID are required"));
  }

  try {
    const [branchExists, exists] = await Promise.all([
      checkallExistence(
        "branch",
        { branch_id, alias },
        "AND",
        branchConnection
      ),
      checkallExistence(
        "parents_learners",
        { parent_id, learner_id },
        "AND",
        branchConnection
      ),
    ]);

    // Check if the parent_id exists
    if (!branchExists) {
      return next(new NotFoundError("branch doesn't exist"));
    }
    if (!exists) {
      return next(
        new NotFoundError(
          `sorry there is no link between parent and learner value`
        )
      );
    }

    // Perform the delink operation
    const userId = await LearnersFunction.delinkLearner(
      {
        learner_id,
        parent_id,
      },
      branchConnection
    );

    await commitTransaction(branchConnection);
    return res.status(StatusCodes.OK).json({ userId });
  } catch (error) {
    if (branchConnection) await rollbackTransaction(branchConnection);
    next(error);
  }
};

const linkLearner = async (req, res, next) => {
  const { alias, branchid: branch_id, learnerid: learner_id } = req.params;
  const { parent_id } = req.body;

  const branchPool = req.branchPool;

  let branchConnection;
  branchConnection = await beginTransaction(branchPool);

  if (!learner_id || !parent_id) {
    return next(new BadRequestError("Learner ID and Parent ID are required"));
  }
  try {
    const [
      branchExists,
      plExists,
      learnerExist,
      parentExist,
      [currentSession],
    ] = await Promise.all([
      checkallExistence(
        "branch",
        { branch_id, alias },
        "AND",
        branchConnection
      ),
      checkallExistence(
        "parents_learners",
        { parent_id, learner_id },
        "AND",
        branchConnection
      ),
      checkoneExistence(
        "montessori_learners",
        "learner_id",
        learner_id,
        branchConnection
      ),
      checkoneExistence("parents", "parent_id", parent_id, branchConnection),
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
        new NotFoundError("Current session not found. Please contact support")
      );
    }
    // Check if the parent_id exists
    if (!branchExists) {
      return next(new NotFoundError("branch doesn't exist"));
    }
    if (plExists) {
      return next(
        new Success(`Parent and learner value has already been linked`)
      );
    }
    if (!learnerExist) {
      return next(
        new NotFoundError(`learner with id: ${learner_id} does not exist`)
      );
    }
    if (!parentExist) {
      return next(
        new NotFoundError(`parent with id: ${parent_id} does not exist`)
      );
    }

    const session_id = currentSession?.session_id;
    const year = currentSession?.session;

    // Prepare data for linking learner to parent
    const data = {
      learner_id,
      parent_id,
      session_id,
      year,
      branch_id,
    };

    // Link the learner and return the result
    const Link = await LearnersFunction.linkLearner(data, branchConnection);
    await commitTransaction(branchConnection);

    return res.status(StatusCodes.OK).json(Link);
  } catch (error) {
    if (branchConnection) await rollbackTransaction(branchConnection);
    next(error);
  }
};

module.exports = { createLearner, updateLearner, delinkLearner, linkLearner };
