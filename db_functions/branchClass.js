const FetchsingleData = require("../post-functions/fetchSingleInputedData");
const LeveltoClass = require("../post-functions/linklevelToClass");
const UpdateData = require("../post-functions/updateData");
const CreateData = require("../post-functions/createData");
const DeLinkLearner = require("../post-functions/delinkLearner");
const updateTableColumns = require("../post-functions/updateTableColumns");
const ValidateLearnerData = require("../post-functions/functions/validateLearnerData");
const {
  DataError,
  BadRequestError,
  MissingFieldsError,
  NotFoundError,
} = require("../error/index");
const _ = require("lodash");
const { StatusCodes } = require("http-status-codes");
const checkallExistence = require("../post-functions/functions/checkallExistence");

// console.log(parentsLearnerId);

const LevelClass = {
  create: async (linkData, id) => {
    // console.log(linkData);
    try {
      const data = await CreateData(
        "branch_classes",
        linkData,
        "branchclass_id",
        id
      );
      return data;
    } catch (error) {
      throw error;
    }
  },
  update: async (linkData, id) => {
    // Call the function to update a product
    const data = await UpdateData(
      "branch_classes",
      linkData,
      "branchclass_id",
      id
    );
    return data;
  },
  setGeneralPassword: async (password, connection) => {
    // Call the function to update a product
    const data = await updateTableColumns(
      "branch_classes",
      "password",
      password,
      connection
    );
    return data;
  },
  delinkLearner: async (user) => {
    // Call the function to update a product
    const { learner_id } = user;
    // console.log(learner_id);
    const data = await DeLinkLearner("parents_learners", user, learner_id);
    return data;
  },
  linkLearner: async (user) => {
    // Call the function to update a product
    const { parent_id } = user;

    const resp = await FetchsingleData("parents", "parent_id", parent_id);
    // console.log(resp);
    const ward = `${resp.title} ${resp.surname} ${resp.othernames} ${resp.firstname} `;
    const wardData = { ward, parent_id };
    const data = await ParentLearner("parents_learners", user, wardData);
    return data;
  },
};

module.exports = LevelClass;
