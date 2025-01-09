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
const deleteData = require("../post-functions/deleteData");

// console.log(parentsLearnerId);

const LevelClass = {
  create: async (linkData, hqPool, branchPool) => {
    const { level_id, class_id } = linkData;
    const c_key = [level_id, class_id];
    // console.log(linkData);

    const data = await CreateData(
      "branch_classes",
      linkData,
      "level_id",
      c_key,
      branchPool,
      "class_id",
      "AND"
    );

    const syncData = await CreateData(
      "branch_classes",
      data,
      "level_id",
      c_key,
      hqPool,
      "class_id",
      "AND"
    );

    return syncData;
  },
  update: async (linkData, id, hqPool, branchPool) => {
    // Call the function to update a product
    const data = await UpdateData(
      "branch_classes",
      linkData,
      "level_id",
      id,
      branchPool,
      "class_id",
      "AND"
    );
    const syncData = await UpdateData(
      "branch_classes",
      data,
      "level_id",
      id,
      hqPool,
      "class_id",
      "AND"
    );
    return syncData;
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
  delinkLearner: async (linkData, pool) => {
    const data = await deleteData(
      "learners_class",
      "learner_id",
      linkData,
      pool,
      "level_id",
      "AND"
    );
    return data;
  },
  linkLearner: async (linkData, pool) => {
    const { level_id, class_id } = linkData;
    const c_key = [level_id, class_id];

    const data = await CreateData(
      "learners_class",
      linkData,
      "level_id",
      c_key,
      pool,
      "class_id",
      "AND"
    );
    return data;
  },
};

module.exports = LevelClass;
