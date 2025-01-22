const UpdateData = require("../post-functions/updateData");
const updateAllChildren = require("../post-functions/updateAllChildren");
const CreateData = require("../post-functions/createData");
const { DataError } = require("../error");
const { InsertMultipleData } = require("../post-functions/postMultipleData");
const CreateJsonData = require("../post-functions/createJsonObject");
const updateJsonData = require("../post-functions/updateJsonData");

const Academics = {
  inputScore: async (score, id, pool) => {
    const data = await CreateJsonData("scores", score, "score_id", id, pool);
    return data;
  },
  updateScore: async (score, id, pool) => {
    const data = await updateJsonData("scores", score, "score_id", id, pool);
    return data;
  },
  createAssessment: async (assessment, id, hqPool) => {
    const data = await CreateData(
      "assessment_type",
      assessment,
      "assessment_id",
      id,
      hqPool
    );

    return data;
  },
  createSubject: async (subject, id, hqPool) => {
    const data = await CreateData(
      "subjects",
      subject,
      "subject_id",
      id,
      hqPool
    );

    return data;
  },
  createMultipleSubject: async (subject, pool) => {
    const data = await InsertMultipleData("subjects", subject, pool);

    return data;
  },
  createMultipleAssessment: async (assessment, pool) => {
    const data = await InsertMultipleData("assessment_type", assessment, pool);
    return data;
  },
  updateAssessment: async (assessment, id, hqPool) => {
    // Call the function to update a product
    const data = await UpdateData(
      "assessment_type",
      assessment,
      "assessment_id",
      id,
      hqPool
    );

    return data;
  },
  updateSubject: async (subject, id, hqPool) => {
    // Call the function to update a product
    const data = await UpdateData(
      "subjects",
      subject,
      "subject_id",
      id,
      hqPool
    );

    return data;
  },
};

module.exports = Academics;
