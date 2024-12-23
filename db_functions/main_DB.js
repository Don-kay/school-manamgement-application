const UpdateData = require("../post-functions/updateData");
const updateAllChildren = require("../post-functions/updateAllChildren");
const CreateDB = require("../post-functions/branchDB/createmainDB");
const { DataError } = require("../error");

const MainDB = {
  storeDB: async (details, id) => {
    const data = await CreateDB("branches", details, "branch_id", id);
    console.log(data);
    return data;
  },
  updateAssessment: async (assessment, id) => {
    // Call the function to update a product
    const data = await UpdateData(
      "assessment_type",
      assessment,
      "assessment_id",
      id
    );

    return data;
  },
};

module.exports = MainDB;
