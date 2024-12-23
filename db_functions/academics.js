const UpdateData = require("../post-functions/updateData");
const updateAllChildren = require("../post-functions/updateAllChildren");
const CreateData = require("../post-functions/createData");
const { DataError } = require("../error");

const Academics = {
  createAssessment: async (assessment, id) => {
    const data = await CreateData(
      "assessment_type",
      assessment,
      "assessment_id",
      id
    );

    return data;
  },
  createSubject: async (subject, id) => {
    const data = await CreateData("subjects", subject, "subject_id", id);

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
  updateSubject: async (subject, id) => {
    // Call the function to update a product
    const data = await UpdateData("subjects", subject, "subject_id", id);

    return data;
  },
};

module.exports = Academics;
