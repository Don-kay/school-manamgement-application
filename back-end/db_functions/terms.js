const UpdateData = require("../post-functions/updateData");
const CreateData = require("../post-functions/createData");

const { StatusCodes } = require("http-status-codes");
const { InsertMultipleData } = require("../post-functions/postMultipleData");

const Terms = {
  create: async (term, id, Pool) => {
    const data = await CreateData("terms", term, "term_id", id, Pool);

    return data;
  },
  createHalf: async (half, id, hqPool) => {
    const data = await CreateData("halves", half, "half_id", id, hqPool);

    return data;
  },
  update: async (term, id, hqPool) => {
    // Call the function to update a product
    const data = await UpdateData("terms", term, "term_id", id, hqPool);
    return data;
  },
  updateHalf: async (half, id, hqPool) => {
    // Call the function to update a product
    const data = await UpdateData("halves", half, "half_id", id, hqPool);
    return data;
  },
  createMultipleTerms: async (term, pool) => {
    const data = await InsertMultipleData("terms", term, pool);
    return data;
  },
  createMultipleHalves: async (half, pool) => {
    const data = await InsertMultipleData("halves", half, pool);
    return data;
  },
};

module.exports = Terms;
