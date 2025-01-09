const BranchFunction = require("../db_functions/branchClass");
const {
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
} = require("../post-functions/functions/dbTransactionHelper");
const {
  DataError,
  NotFoundError,
  BadRequestError,
  UnauthenticatedError,
} = require("../error");
const {
  connection,
  masterPool,
  getBranchPool,
} = require("../config/connection");
const { StatusCodes } = require("http-status-codes");
const checkoneExistence = require("../post-functions/functions/checkoneExistence");
const checkallExistence = require("../post-functions/functions/checkallExistence");
const fetchallExistence = require("../post-functions/fetchallExistence");
const FetchSinglemainDB = require("../post-functions/branchDB/fetchSinglemainDB");

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
  const { level_id, class_id, staff_id } = req.body;

  const branchPool = req.branchPool;

  let branchConnection, hqConnection;

  branchConnection = await beginTransaction(branchPool);

  const errorMessage = (type) =>
    `${type} is invalid. Please recheck your details and try again. If the error persists, contact support.`;
  try {
    const hq = await FetchSinglemainDB("branches", "hq", "true");
    const hqid = hq.branch_id;

    const hqPool = await getBranchPool(hqid);

    hqConnection = await beginTransaction(hqPool);

    const [branchData, yearLevel, classType, classExist] = await Promise.all([
      checkallExistence(
        "branch",
        { branch_id, alias },
        "AND",
        branchConnection
      ),
      checkoneExistence("year_level", "level_id", level_id, branchConnection),
      checkoneExistence("class_type", "class_id", class_id, branchConnection),
      checkallExistence(
        "branch_classes",
        {
          level_id,
          class_id,
        },
        "AND",
        branchConnection
      ),
    ]);

    if (!branchData) {
      return next(
        new NotFoundError(
          "Branch does not exist, please verify and try again. If error persist, contact support"
        )
      );
    }

    // Validate year level data
    if (!yearLevel) {
      return next(new DataError(errorMessage("Year level")));
    }

    // Validate class type data
    if (!classType) {
      return next(new DataError(errorMessage("Class type")));
    }

    if (classExist) {
      throw new DataError(
        "unable complete process. class exists, please verify details and try again"
      );
    }

    const [[currentSession]] = await Promise.all([
      fetchallExistence(
        "academic_session",
        {
          current: "true",
        },
        branchConnection
      ),
    ]);

    if (!currentSession) {
      return next(
        new NotFoundError("sorry, no current year set, please contact support")
      );
    }

    if (staff_id !== undefined) {
      const staffExtst = await checkallExistence(
        "staff",
        { staff_id, branch_id },
        "AND",
        branchConnection
      );
      if (!staffExtst) {
        return next(
          new NotFoundError(`staff with id:${staff_id} doesn't exist`)
        );
      }
    }

    req.body.session_id = currentSession.session_id;
    req.body.year = currentSession.session;
    req.body.branch_id = branch_id;

    //use branchclass instead of level id in the scores api

    const leveltoclassProp = await BranchFunction.create(
      req.body,
      hqConnection,
      branchConnection
    );

    await commitTransaction(branchConnection);
    await commitTransaction(hqConnection);

    return res.status(StatusCodes.CREATED).json(leveltoclassProp);
  } catch (error) {
    if (hqConnection) await rollbackTransaction(hqConnection);
    if (branchConnection) await rollbackTransaction(branchConnection);

    return next(error);
  }
};
const updateBranchClass = async (req, res, next) => {
  const { alias, branchid: branch_id, levelid, classid } = req.params;
  const { level_id, class_id, staff_id } = req.body;

  const branchPool = req.branchPool;

  let branchConnection, hqConnection;

  branchConnection = await beginTransaction(branchPool);

  const errorMessage = (type) =>
    `${type} is invalid. Please recheck your details and try again. If the error persists, contact support.`;
  try {
    const hq = await FetchSinglemainDB("branches", "hq", "true");
    const hqid = hq.branch_id;

    const hqPool = await getBranchPool(hqid);

    hqConnection = await beginTransaction(hqPool);

    const [branchData, branchClass, yearLevel, classType] = await Promise.all([
      checkallExistence(
        "branch",
        { branch_id, alias },
        "AND",
        branchConnection
      ),
      checkallExistence(
        "branch_classes",
        { level_id: levelid, class_id: classid },
        "AND",
        branchConnection
      ),
      checkoneExistence("year_level", "level_id", level_id, branchConnection),
      checkoneExistence("class_type", "class_id", class_id, branchConnection),
    ]);

    if (!branchData) {
      return next(
        new NotFoundError(
          "Branch does not exist, please verify and try again. If error persist, contact support"
        )
      );
    }

    // Validate year level data
    if (level_id !== undefined) {
      if (yearLevel === false) {
        return next(new DataError(errorMessage("Year level")));
      }
    }

    if (class_id !== undefined) {
      // Validate class type data
      if (classType === false) {
        return next(new DataError(errorMessage("Class type")));
      }
    }

    if (!branchClass) {
      return next(
        new NotFoundError(
          `Class does not exist, please verify and try again. If error persist, contact support`
        )
      );
    }

    if ((level_id !== undefined) & (class_id !== undefined)) {
      const classExist = await checkallExistence(
        "branch_classes",
        {
          level_id,
          class_id,
        },
        "AND",
        branchConnection
      );

      if (classExist) {
        throw new DataError(
          "unable complete request. class with input set exists, please verify details and try again"
        );
      }
    }

    if (staff_id !== undefined) {
      const staffExtst = await checkallExistence(
        "staff",
        { staff_id, branch_id },
        "AND",
        branchConnection
      );
      if (!staffExtst) {
        return next(
          new NotFoundError(`staff with id:${staff_id} doesn't exist`)
        );
      }
    }

    const leveltoclassProp = await BranchFunction.update(
      req.body,
      [levelid, classid],
      hqConnection,
      branchConnection
    );

    await commitTransaction(branchConnection);
    await commitTransaction(hqConnection);

    return res.status(StatusCodes.CREATED).json(leveltoclassProp);
  } catch (error) {
    if (hqConnection) await rollbackTransaction(hqConnection);
    if (branchConnection) await rollbackTransaction(branchConnection);
    // console.log(error);
    next(error);
  }
};
const linkLearnerToClass = async (req, res, next) => {
  const { alias, branchid: branch_id } = req.params;
  const { level_id, class_id, learner_id } = req.body;

  const branchPool = req.branchPool;

  let branchConnection;

  branchConnection = await beginTransaction(branchPool);

  const errorMessage = (type) =>
    `${type} is invalid. Please recheck your details and try again. If the error persists, contact support.`;

  try {
    const [[currentSession]] = await Promise.all([
      fetchallExistence(
        "academic_session",
        {
          current: "true",
        },
        branchPool
      ),
    ]);

    if (!currentSession) {
      return next(
        new NotFoundError("sorry, no current year set, please contact support")
      );
    }

    if (learner_id !== undefined) {
      const learnerExist = await checkallExistence(
        "montessori_learners",
        { learner_id, branch_id },
        "AND",
        branchPool
      );
      if (!learnerExist) {
        return next(
          new NotFoundError(`learner with id:${learner_id} doesn't exist`)
        );
      }
    }

    const isLinked = await checkallExistence(
      "learners_class",
      { learner_id, level_id, class_id },
      "AND",
      branchPool
    );

    if (isLinked) {
      return next(new DataError("learner exists in this class."));
    }

    const learnerExist = await checkoneExistence(
      "learners_class",
      "learner_id",
      learner_id,
      branchPool
    );

    if (learnerExist) {
      throw new DataError(
        "unable complete process. Learner already belongs to a class, please delink learner from class and try again"
      );
    }

    const [branchData, yearLevel, classType, classExist] = await Promise.all([
      checkallExistence("branch", { branch_id, alias }, "AND", branchPool),
      checkoneExistence("year_level", "level_id", level_id, branchPool),
      checkoneExistence("class_type", "class_id", class_id, branchPool),
      checkallExistence(
        "branch_classes",
        {
          level_id,
          class_id,
        },
        "AND",
        branchPool
      ),
    ]);

    if (!branchData) {
      return next(
        new NotFoundError(
          "Branch does not exist, please verify and try again. If error persist, contact support"
        )
      );
    }

    // Validate year level data
    if (!yearLevel) {
      return next(new DataError(errorMessage("Year level")));
    }

    // Validate class type data
    if (!classType) {
      return next(new DataError(errorMessage("Class type")));
    }

    if (!classExist) {
      throw new DataError(
        "unable complete process. class does not exist, please verify details and try again"
      );
    }
    req.body.session_id = currentSession.session_id;
    req.body.year = currentSession.session;
    req.body.branch_id = branch_id;

    //use branchclass instead of level id in the scores api

    const learnertoclassProp = await BranchFunction.linkLearner(
      req.body,
      branchPool
    );

    await commitTransaction(branchConnection);

    return res.status(StatusCodes.CREATED).json(learnertoclassProp);
  } catch (error) {
    if (branchConnection) await rollbackTransaction(branchConnection);

    return next(error);
  }
};
const delinkLearnerFromClass = async (req, res, next) => {
  const {
    alias,
    branchid: branch_id,
    learnerid: learner_id,
    levelid: level_id,
    classid: class_id,
  } = req.params;

  const branchPool = req.branchPool;

  // Check if both learnerid and parent_id are provided
  if (!learner_id) {
    return next(new BadRequestError("Learner ID are required"));
  }

  try {
    const [branchExists, classExist, exists] = await Promise.all([
      checkallExistence("branch", { branch_id, alias }, "AND", branchPool),
      checkallExistence(
        "branch_classes",
        { level_id, class_id },
        "AND",
        branchPool
      ),
      checkallExistence(
        "learners_class",
        { learner_id, level_id, class_id },
        "AND",
        branchPool
      ),
    ]);

    // Check if the parent_id exists
    if (!branchExists) {
      return next(new NotFoundError("branch doesn't exist"));
    }
    if (!classExist) {
      return next(
        new NotFoundError(
          "class doesn't exist. Please ensure that class exist."
        )
      );
    }
    if (!exists) {
      return next(
        new NotFoundError(`sorry there is no link between learner and class`)
      );
    }

    // Perform the delink operation
    const userId = await BranchFunction.delinkLearner(
      [learner_id, level_id],
      branchPool
    );

    return res.status(StatusCodes.OK).json({ userId });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  branchClass,
  updateBranchClass,
  linkLearnerToClass,
  delinkLearnerFromClass,
};
