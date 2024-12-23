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
  create: async (user, id) => {
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
        id
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
      const linkLearner = await ParentLearner("parents_learners", newData);
      // console.log(linkLearner);
      return { linkLearner, data };
    } catch (error) {
      // Log the error for debugging purposes
      // console.log("Error creating learner:", error);
      throw error;
      // Handle specific error types with custom messages or actions
      // if (error instanceof MissingFieldsError) {
      //   throw error; // Re-throw to let the calling function handle it
      // } else if (error instanceof DataError) {
      //   throw error; // Re-throw to let the calling function handle it
      // } else if (error instanceof BadRequestError) {
      //   throw error; // Re-throw to let the calling function handle it
      // } else {
      //   // Handle unexpected errors
      //   throw new Error(
      //     "An unexpected error occurred while creating the learner"
      //   );
      // }
    }
  },

  update: async (user, id) => {
    // Call the function to update a product
    const data = await UpdateData(
      "montessori_learners",
      user,
      "learner_id",
      id
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

module.exports = Learners;
