const FetchsingleData = require("../post-functions/fetchSingleInputedData");
const ParentLearner = require("../post-functions/learnertoParent");
const UpdateData = require("../post-functions/updateData");
const CreateData = require("../post-functions/createData");
const DeLinkLearner = require("../post-functions/delinkLearner");
const ValidateLearnerData = require("../post-functions/functions/validateLearnerData");
const {
  DataError,
  BadRequestError,
  MissingFieldsError,
} = require("../error/index");
const _ = require("lodash");
const { StatusCodes } = require("http-status-codes");

// console.log(parentsLearnerId);

const Learners = {
  create: async (user, id, pool) => {
    try {
      if (!ValidateLearnerData(user)) {
        throw new MissingFieldsError(
          "Invalid learner details, please fill all necessary fields and try again"
        );
      }

      //Create a new learner record

      const data = await CreateData(
        "montessori_learners",
        user,
        "learner_id",
        id,
        pool
      );

      // Handle potential failure in data creation
      if (!data || Object.keys(data).length === 0) {
        throw new BadRequestError("Unable to create user");
      }
      const { learner_id, parent_id, year, session_id, branch_id } = data;

      // Prepare data for linking learner with parent
      const newData = {
        learner_id,
        parent_id,
        year,
        session_id,
        branch_id,
      };

      // Link learner to parent and return results
      const linkLearner = await ParentLearner(
        "parents_learners",
        newData,
        pool
      );
      // console.log(linkLearner);
      return { linkLearner, data };
    } catch (error) {
      // Log the error for debugging purposes
      // console.log("Error creating learner:", error);
      throw error;
    }
  },

  update: async (user, id, branchPool) => {
    // Call the function to update a product
    const data = await UpdateData(
      "montessori_learners",
      user,
      "learner_id",
      id,
      branchPool
    );
    return data;
  },
  delinkLearner: async (user, branchPool) => {
    // Call the function to update a product
    const { learner_id } = user;

    const data = await DeLinkLearner(
      "parents_learners",
      user,
      learner_id,
      branchPool
    );

    return data;
  },
  linkLearner: async (user, branchPool) => {
    // Call the function to update a product
    const { parent_id, learner_id } = user;

    const resp = await FetchsingleData(
      "parents",
      "parent_id",
      parent_id,
      branchPool
    );
    // console.log(resp);
    const ward = `${resp.title} ${resp.surname} ${resp.othernames} ${resp.firstname} `;
    const surname = `${resp.surname} `;
    const wardData = { ward, parent_id, surname };

    await UpdateData(
      "montessori_learners",
      wardData,
      "learner_id",
      learner_id,
      branchPool
    );

    const data = await ParentLearner("parents_learners", user, branchPool);

    return { data, msg: "successfully updated learner details" };
  },
};

module.exports = Learners;
