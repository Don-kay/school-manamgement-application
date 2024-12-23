const UpdateData = require("../post-functions/updateData");
const CreateData = require("../post-functions/createData");

const { StatusCodes } = require("http-status-codes");

const Terms = {
  create: async (term, id) => {
    const data = await CreateData("terms", term, "term_id", id);
    return data;
  },
  update: async (term, id) => {
    // Call the function to update a product
    const data = await UpdateData("terms", term, "term_id", id);

    if (data.msg === "successfully updated") {
      return data;
    } else {
      return { err: "no changes made" };
    }
  },
};

module.exports = Terms;
