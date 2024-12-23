const BranchFunction = require("../db_functions/branchClass");
const generateUUId = require("../post-functions/functions/generateUuid");
const checkId = require("../post-functions/functions/checksingleExistence");
const {
  DataError,
  NotFoundError,
  BadRequestError,
  UnauthenticatedError,
} = require("../error");
const { connection } = require("../config/connection");
const { StatusCodes } = require("http-status-codes");
const checkoneExistence = require("../post-functions/functions/checkoneExistence");
const checkallExistence = require("../post-functions/functions/checkallExistence");
const fetchallExistence = require("../post-functions/fetchallExistence");
const { hashPassword } = require("../config/passwordConfig");

function hasOnlyOneSpecificObject(obj, targetObj) {
  const keys = Object.keys(obj);

  // Ensure there is only one key in the object
  if (keys.length !== 1) {
    throw new BadRequestError("password violation");
  }

  // Get the value of the first (and only) key
  const value = keys[0];

  // Compare the value to the target object
  return JSON.stringify(value) === JSON.stringify(targetObj);
}

const branchClass = async (req, res, next) => {
  const { alias, branchid: branch_id } = req.params;
  const { level_id, class_id } = req.body;

  // console.log(req);

  //const staff_id = req.staff?.staff_id;

  // const isAuthorized = await checkallExistence(
  //   "staff",
  //   { staff_id, branch_id },
  //   "AND"
  // );

  // if (!isAuthorized) {
  //   return next(
  //     new UnauthenticatedError(
  //       "you are not authenticated to access this branch, verify your branch and try again"
  //     )
  //   );
  // }

  try {
    const [branchData, yearLevel, classType, classExist] = await Promise.all([
      checkallExistence("branch", { branch_id, alias }, "AND"),
      checkoneExistence("year_level", "level_id", level_id),
      checkoneExistence("class_type", "class_id", class_id),
      checkallExistence(
        "branch_classes",
        {
          level_id,
          class_id,
          branch_id,
        },
        "AND"
      ),
    ]);

    const errorMessage = (type) =>
      `${type} is invalid. Please recheck your details and try again. If the error persists, contact support.`;

    if (!branchData) {
      return next(
        new NotFoundError(
          "Branch does not exist, please verify and try again. If error persist, contact support"
        )
      );
    }

    // Validate year level data
    if (yearLevel === false) {
      return next(new DataError(errorMessage("Year level")));
    }

    // Validate class type data
    if (classType === false) {
      return next(new DataError(errorMessage("Class type")));
    }

    if (classExist) {
      throw new DataError(
        "unable complete process. class exists, please verify details and try again"
      );
    }

    const [[currentSession], branchclass_id] = await Promise.all([
      fetchallExistence("academic_session", {
        current: "true",
      }),
      generateUUId("branch_classes", "branchclass_id", "YEARCLASS"),
    ]);

    if (!currentSession) {
      return next(
        new NotFoundError("sorry, no current year set, please contact support")
      );
    }

    if (
      !branchclass_id ||
      branchclass_id === "failed to generate unique id after 10 attempts"
    ) {
      return next(
        new BadRequestError(
          "Failed to generate a unique year level ID. Please try again."
        )
      );
    }

    req.body.branchclass_id = branchclass_id;
    req.body.session_id = currentSession.session_id;
    req.body.year = currentSession.session;
    req.body.branch_id = branch_id;

    // const leveltoclassProp = await BranchFunction.create(
    //   req.body,
    //   branchclass_id
    // );
    // return res.status(StatusCodes.CREATED).json(leveltoclassProp);
  } catch (error) {
    // console.log(error);
    next(error);
  }
};
const updateBranchClass = async (req, res, next) => {
  const { alias, branchid, bclassid: branchclass_id } = req.params;
  const { level_id, class_id, branch_id } = req.body;

  try {
    const [
      branchData,
      branchClass,
      yearLevel,
      classType,
      isAuthorized,
      classExist,
    ] = await Promise.all([
      checkallExistence("branch", { branch_id: branchid, alias }, "AND"),
      checkoneExistence("branch_classes", "branchclass_id", branchclass_id),
      checkoneExistence("year_level", "level_id", level_id),
      checkoneExistence("class_type", "class_id", class_id),
      checkallExistence(
        "branch_classes",
        {
          branch_id: branchid,
          branchclass_id,
        },
        "AND"
      ),
      checkallExistence(
        "branch_classes",
        {
          level_id,
          class_id,
          branch_id,
        },
        "AND"
      ),
    ]);

    if (!branchClass) {
      return next(
        new NotFoundError(
          `Class with id:${branchclass_id} does not exist, please verify and try again. If error persist, contact support`
        )
      );
    }

    const errorMessage = (type) =>
      `${type} is invalid. Please recheck your details and try again. If the error persists, contact support.`;

    if (!branchData) {
      return next(
        new NotFoundError(
          "Branch does not exist, please verify and try again. If error persist, contact support"
        )
      );
    }

    // Validate year level data
    if (yearLevel === false) {
      return next(new DataError(errorMessage("Year level")));
    }

    // Validate class type data
    if (classType === false) {
      return next(new DataError(errorMessage("Class type")));
    }

    if (!isAuthorized) {
      throw new BadRequestError("fatal Error. unauthorized to make updates");
    }

    if (classExist) {
      throw new DataError(
        "unable complete request. class with input set exists, please verify details and try again"
      );
    }

    const leveltoclassProp = await BranchFunction.update(
      req.body,
      branchclass_id
    );
    return res.status(StatusCodes.CREATED).json(leveltoclassProp);
  } catch (error) {
    // console.log(error);
    next(error);
  }
};
const setBClassPassword = async (req, res, next) => {
  const { alias, branchid } = req.params;
  const { password } = req.body;

  const transactionConnect = await connection.getConnection();

  try {
    await transactionConnect.beginTransaction();

    // Function to check if an object has exactly one key-value pair with a specific object as its value
    if (!hasOnlyOneSpecificObject(req.body, "password")) {
      return next(
        new BadRequestError("invali request, task is strictly for password")
      );
    }

    const [branchData] = await Promise.all([
      checkallExistence("branch", { branch_id: branchid, alias }, "AND"),
    ]);

    if (!branchData) {
      await transactionConnect.rollback();
      return next(
        new NotFoundError(
          "Branch does not exist, please verify and try again. If error persist, contact support"
        )
      );
    }

    const hashPwd = await hashPassword(password);

    req.body.password = hashPwd;

    await transactionConnect.commit();
    const leveltoclassProp = await BranchFunction.setGeneralPassword(
      req.body,
      transactionConnect
    );
    return res.status(StatusCodes.CREATED).json(leveltoclassProp);
  } catch (error) {
    if (transactionConnect) await transactionConnect.rollback();
    next(error);
  } finally {
    if (transactionConnect) transactionConnect.release();
  }
};

module.exports = {
  branchClass,
  updateBranchClass,
  setBClassPassword,
};
