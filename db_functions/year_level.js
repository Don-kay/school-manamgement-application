const FetchsingleData = require("../post-functions/fetchSingleInputedData");
const CreateData = require("../post-functions/createData");
const UpdateData = require("../post-functions/updateData");
const { StatusCodes } = require("http-status-codes");
const { DataError } = require("../error");

const YearLevel = {
  create: async (level, level_id) => {
    const data = await CreateData("year_level", level, "level_id", level_id);
    return data;
  },
  createClassType: async (classType) => {
    const { class_id, class_type } = classType;
    const c_key = [class_id, class_type];
    const data = await CreateData(
      "class_type",
      classType,
      "class_id",
      c_key,
      "class_type",
      "AND"
    );
    return data;
  },
  update: async (level, id) => {
    // Call the function to update a product

    const data = await UpdateData("year_level", level, "level_id", id);

    return data;
  },
  updateClassType: async (classData, id) => {
    // Call the function to update a product
    const data = await UpdateData("class_type", classData, "class_id", id);
    return data;
  },
};

module.exports = YearLevel;
