const LearnersFunction = require("../db_functions/learners");
const generateUUId = require("../post-functions/functions/generateUuid");
const checkId = require("../post-functions/functions/checksingleExistence");
const { DataError, NotFoundError, BadRequestError } = require("../error");
const { StatusCodes } = require("http-status-codes");
const checkallExistence = require("../post-functions/functions/checkallExistence");
const fetchallExistence = require("../post-functions/fetchallExistence");
const GenerateCode = require("../post-functions/functions/generateCode");
const checkoneExistence = require("../post-functions/functions/checkoneExistence");
const FetchSingleData = require("../post-functions/fetchSingleInputedData");

const createLearner = async (req, res, next) => {
  const { alias, branchid: branch_id } = req.params;
  const { parent_id, dob, age } = req.body;

  try {
    const learnerInputAge = dob.split("-")[0];
    const currentYear = new Date().getFullYear();
    const learnerAge = currentYear - learnerInputAge;

    const [branchExists, [currentSession], parent] = await Promise.all([
      checkallExistence("branch", { branch_id, alias }, "AND"),
      fetchallExistence("academic_session", {
        current: "true",
      }),
      FetchSingleData("parents", "parent_id", parent_id),
    ]);

    if (!branchExists) {
      return next(new NotFoundError("branch doesn't exist"));
    }
    if (!parent || Object.keys(parent).length === 0) {
      return next(
        new NotFoundError(
          "Parent information is not available or invalid. Please verify and try again."
        )
      );
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
      "LEARN"
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
      prefix
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

    const learnerId = await LearnersFunction.create(req.body, learner_id);
    return res.status(StatusCodes.CREATED).json({ learnerId });
  } catch (error) {
    // console.log(error);
    next(error);
  }
};

const updateLearner = async (req, res, next) => {
  const { learnerid: learner_id } = req.params;
  const updateData = req.body;

  try {
    const idPresent = await checkId(
      "montessori_learners",
      "learner_id",
      learner_id
    );

    if (idPresent?.err) {
      throw new NotFoundError(`User with id: ${learner_id} doesn't exist`);
    }

    const learnerProp = await LearnersFunction.update(updateData, learner_id);
    return res.status(StatusCodes.OK).json({ learnerProp });
  } catch (error) {
    // Proper error logging can be added here if needed, e.g., using a logging library
    return next(error);
  }
};

const delinkLearner = async (req, res, next) => {
  const { learnerid } = req.params;
  const { parent_id } = req.body;

  // Check if both learnerid and parent_id are provided
  if (!learnerid || !parent_id) {
    return next(new BadRequestError("Learner ID and Parent ID are required"));
  }

  try {
    // Check if the parent_id exists
    const idPresent = await checkId("parents_learners", "parent_id", parent_id);
    if (idPresent.err === 404) {
      return next(
        new NotFoundError(`User with id: ${parent_id} doesn't exist`)
      );
    }

    // Perform the delink operation
    const userId = await LearnersFunction.delinkLearner({
      learner_id: learnerid,
      parent_id,
    });
    return res.status(StatusCodes.OK).json({ userId });
  } catch (error) {
    // Log the error for debugging purposes
    //console.error(`Error in delinkLearner: ${error.message}`);
    next(error);
  }
};

const linkLearner = async (req, res, next) => {
  try {
    const { learnerid } = req.params;
    const { parent_id } = req.body;

    if (linkId === "failed to generate unique id after 10 attempts") {
      throw new Error("Unable to generate a unique link ID");
    }

    // Check if parent_id exists in the database
    const idCheckResult = await checkId(
      "parents_learners",
      "parent_id",
      parent_id
    );

    if (idCheckResult.err === 404) {
      throw new NotFoundError(`User with id: ${parent_id} doesn't exist`);
    }

    // Prepare data for linking learner to parent
    const data = {
      learner_id: learnerid,
      parent_id,
      parents_learners_id: linkId,
    };

    // Link the learner and return the result
    const userId = await LearnersFunction.linkLearner(data);
    return res.status(StatusCodes.OK).json(userId);
  } catch (error) {
    next(error);
  }
};

module.exports = { createLearner, updateLearner, delinkLearner, linkLearner };
