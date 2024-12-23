const ParentsFunction = require("../db_functions/parents");
const generateUUId = require("../post-functions/functions/generateUuid");
const checkId = require("../post-functions/functions/checksingleExistence");
const { StatusCodes } = require("http-status-codes");
const { BadRequestError, NotFoundError, DataError } = require("../error");
const fetchallExistence = require("../post-functions/fetchallExistence");
const checkallExistence = require("../post-functions/functions/checkallExistence");
const FetchMany = require("../post-functions/fetchMany");

const createParent = async (req, res, next) => {
  const { alias, branchid: branch_id } = req.params;
  const { phone_number, email, title } = req.body;

  const validatePhoneNumber = (phone, label) => {
    if (!/^\d{10}$/.test(phone)) {
      throw new BadRequestError(
        `Invalid ${label} phone number. Please enter a valid 10-digit number.`
      );
    }
  };

  const validateEmail = (email, label) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestError(
        `Invalid ${label} email address. Please enter a valid email.`
      );
    }
  };

  try {
    const gender = title === "Mr" || title === "Mr and Mrs" ? "male" : "female";

    validatePhoneNumber(phone_number, "phone");
    validateEmail(email, "user");
    if (!branch_id) {
      return next(
        new DataError("Unable to complete request, please specify a branch.")
      );
    }

    const [branchData, [currentSession]] = await Promise.all([
      checkallExistence("branch", { branch_id, alias }, "AND"),
      fetchallExistence("academic_session", {
        current: "true",
      }),
    ]);

    if (!branchData) {
      return next(
        new NotFoundError(
          "Branch does not exist, check the entry and try again. If error persist, contact support"
        )
      );
    }

    if (!currentSession) {
      return next(
        new NotFoundError("sorry, no current year set, please contact support")
      );
    }

    const session_id = currentSession.session_id;
    const year = currentSession.session;

    const parent_id = await generateUUId("parents", "parent_id", "PARENT");

    if (
      !parent_id ||
      parent_id === "failed to generate unique id after 10 attempts"
    ) {
      return next(
        new BadRequestError(
          "Failed to generate a unique staff ID. Please try again."
        )
      );
    }

    req.body = {
      ...req.body,
      parent_id,
      session_id,
      year,
      personnel: "parent",
      branch_id,
      gender,
      registered_kids: 0,
    };

    const parentProp = await ParentsFunction.create(req.body, parent_id);
    return res.status(StatusCodes.CREATED).json(parentProp);
  } catch (error) {
    // console.log(error);
    return next(error);
  }
};
const updateParent = async (req, res, next) => {
  const { parentid: parent_id, alias, branchid: branch_id } = req.params;
  const { phone_number, email } = req.body;

  const validatePhoneNumber = (phone, label) => {
    if (!/^\d{10}$/.test(phone)) {
      throw new BadRequestError(
        `Invalid ${label} phone number. Please enter a valid 10-digit number.`
      );
    }
  };

  const validateEmail = (email, label) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestError(
        `Invalid ${label} email address. Please enter a valid email.`
      );
    }
  };

  try {
    validatePhoneNumber(phone_number, "phone");
    validateEmail(email, "user");
    if (!branch_id) {
      return next(
        new DataError("Unable to complete request, please specify a branch.")
      );
    }

    const [branchData, checkParentExists] = await Promise.all([
      checkallExistence("branch", { branch_id, alias }, "AND"),
      checkallExistence("parents", { branch_id, parent_id }, "AND"),
    ]);

    if (!branchData) {
      return next(
        new NotFoundError(
          "Branch does not exist, check the entry and try again. If error persist, contact support"
        )
      );
    }

    const [fetchParentsKids] = await FetchMany(
      "montessori_learners",
      "parent_id",
      parent_id
    );

    const learnerId = fetchParentsKids.map((idx) => idx.learner_id);
    //console.log(learnerId);
    if (!checkParentExists) {
      return next(
        new BadRequestError(
          `invalid request, parents with id:${parent_id} doesn't exists`
        )
      );
    }

    // req.body = { ...req.body };

    // Update parent properties
    const parentProp = await ParentsFunction.update(
      req.body,
      parent_id,
      learnerId
    );

    // Respond with success
    res.status(StatusCodes.CREATED).json({ parentProp });
  } catch (error) {
    // Respond with error
    return next(error);
  }
};
const registeredKids = async (req, res, next) => {
  const { parentid: parent_id } = req.params;
  try {
    // Check if the parent ID exists
    const idPresent = await checkId("parents", "parent_id", parent_id);
    if (idPresent.err === 404) {
      return next(
        new NotFoundError(`parent with ID ${parent_id} does not exist`)
      );
    }

    // Update parent properties
    const parentProp = await ParentsFunction.registerKids(parent_id);

    // Respond with success
    return res.status(StatusCodes.CREATED).json({ parentProp });
  } catch (error) {
    // Respond with error
    return next(error);
  }
};

module.exports = { createParent, updateParent, registeredKids };