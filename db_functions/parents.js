const UpdateData = require("../post-functions/updateData");
const updateIncrement = require("../post-functions/updateIncrement");
const UpdateMany = require("../post-functions/updateMany");
const CreateData = require("../post-functions/createData");
const fetchPPlink = require("../post-functions/fetchPPlinked");
const { StatusCodes } = require("http-status-codes");
const FetchMany = require("../post-functions/fetchMany");
const { NotFoundError } = require("../error");
const LinkLearnerData = require("../post-functions/learnertoParent");
const checkallExistence = require("../post-functions/functions/checkallExistence");
const UpdateLearnerData = require("../post-functions/updatelearnertoParent");

const Parents = {
  create: async (user, id, branchPool) => {
    const data = await CreateData("parents", user, "parent_id", id, branchPool);
    return data;
  },
  update: async (user, id, learnerid, branchPool) => {
    //Update the parent data

    const data = await UpdateData("parents", user, "parent_id", id, branchPool);

    if (learnerid.length !== 0) {
      // Destructure the data.fetchData object
      const {
        surname,
        firstname,
        othernames,
        title,
        parent_id,
        state_of_origin,
        nationality,
        year,
        session_id,
        branch_id,
      } = data;

      //link parents and learners
      for (let idx of learnerid) {
        const insertid = { parent_id, learner_id: idx };
        const learnerIsLinked = await checkallExistence(
          "parents_learners",
          { parent_id, learner_id: idx },
          "AND",
          branchPool
        );

        if (!learnerIsLinked) {
          await LinkLearnerData(
            "parents_learners",
            {
              parent_id,
              learner_id: idx,
              year,
              session_id,
              branch_id,
            },
            branchPool
          );
        }
        await UpdateLearnerData(
          "parents_learners",
          { branch_id },
          insertid,
          branchPool
        );
      }

      // Prepare columns for update
      const columns = {
        ward: `${title} ${surname} ${othernames} ${firstname}`,
        surname,
        nationality,
        branch_id,
        state_of_origin: nationality.toLowerCase().includes("nigerian")
          ? state_of_origin
          : "none",
      };

      // Fetch linked learners
      const [learners] = await fetchPPlink(
        "montessori_learners",
        "parents_learners",
        "learner_id",
        "parent_id",
        id,
        branchPool
      );

      // Check if learners data is valid and has entries
      if (!learners || learners.length === 0) {
        return { data };
      }

      // Extract learner IDs and update them
      const learnerId = learners.map(({ learner_id }) => learner_id);

      const updatePL = await UpdateMany(
        "montessori_learners",
        learnerId,
        columns,
        "learner_id",
        branchPool
      );

      return { updatePL, data };
    } else {
      return data;
    }
  },
  registerKids: async (parent_id) => {
    const [parentKids] = await FetchMany(
      "montessori_learners",
      "parent_id",
      parent_id
    );
    const registered_kids = parentKids?.length;
    if (parentKids.length === 0 || !parentKids || parentKids?.err) {
      throw new NotFoundError("parent has registered no learner");
    }
    const updateParent = await updateIncrement(
      "parents",
      { registered_kids },
      "parent_id",
      parent_id
    );
    // console.log(updateParent);
    return updateParent;
  },
};

module.exports = Parents;
