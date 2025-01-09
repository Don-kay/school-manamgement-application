const FetchsingleData = require("../post-functions/fetchSingleInputedData");
const CreateData = require("../post-functions/createData");
const UpdateData = require("../post-functions/updateData");
const { StatusCodes } = require("http-status-codes");
const { DataError } = require("../error");
const { InsertMultipleData } = require("../post-functions/postMultipleData");

const YearLevel = {
  create: async (level, level_id, hqPool) => {
    const data = await CreateData(
      "year_level",
      level,
      "level_id",
      level_id,
      hqPool
    );
    return data;
  },
  createClassType: async (classType, hqPool) => {
    const { class_id, class_type } = classType;
    const c_key = [class_id, class_type];
    const data = await CreateData(
      "class_type",
      classType,
      "class_id",
      c_key,
      hqPool,
      "class_type",
      "AND"
    );
    return data;
  },
  update: async (level, id, hqPool) => {
    // Call the function to update a product

    const data = await UpdateData("year_level", level, "level_id", id, hqPool);

    return data;
  },
  updateClassType: async (classData, id, hqPool) => {
    // Call the function to update a product
    const data = await UpdateData(
      "class_type",
      classData,
      "class_id",
      id,
      hqPool
    );
    return data;
  },
  createMultipleYearLevel: async (level, pool) => {
    const data = await InsertMultipleData("year_level", level, pool);
    return data;
  },
  createMultipleClassType: async (classtype, pool) => {
    const data = await InsertMultipleData("class_type", classtype, pool);
    return data;
  },
};

module.exports = YearLevel;
