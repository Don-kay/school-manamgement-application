const MainDBFunction = require("../db_functions/main_DB");
const generateUUId = require("../post-functions/functions/generateUuid");
const checkId = require("../post-functions/functions/checksingleExistence");
const { StatusCodes } = require("http-status-codes");
const checkallExistence = require("../post-functions/functions/checkallExistence");
const { BadRequestError, DataError, NotFoundError } = require("../error");
const fetchallExistence = require("../post-functions/fetchallExistence");
const { masterPool } = require("../config/connection");
const updateData = require("../post-functions/updateData");
const checkoneExistence = require("../post-functions/functions/checkoneExistence");

const createBranchDB = async (req, res, next) => {
  const { branch_id } = req.body;
  try {
    // Check if there is a current academic year already
    // const currentSession = await fetchallExistence("academic_session", {
    //   current: "true",
    // });
    console.log(true);
    // const session_id = currentSession?.[0]?.session_id;
    // const year = currentSession?.[0]?.session;

    // Assign values to request body
    // req.body = {
    //   ...req.body,
    //   // session_id,
    //   // year,
    //   branch_id,
    //   branch_name,
    //   branch_host,
    //   branch_user,
    //   branch_password,
    //   branch_port,
    // };

    //Proceed with session creation logic (commented out for now)
    const MainBranch = await MainDBFunction.storeDB(req.body, branch_id);

    return res.status(StatusCodes.CREATED).json(MainBranch);
  } catch (error) {
    next(error);
  }
};

const updateBranch = async (req, res, next) => {
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

module.exports = {
  createBranchDB,
  updateBranch,
};
