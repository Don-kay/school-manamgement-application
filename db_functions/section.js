const UpdateData = require("../post-functions/updateData");
const CreateData = require("../post-functions/createData");
const FetchMany = require("../post-functions/fetchMany");
const UpdateMany = require("../post-functions/updateMany");
const { StatusCodes } = require("http-status-codes");
const { NotFoundError, DataError } = require("../error");
const MissingFieldError = require("../error/missingFieldserror");

const Sections = {
  create: async (section, id) => {
    const { section_name, section_id, branch_id, session_id, year, fees } =
      section;

    if (
      !section_name ||
      !section_id ||
      !branch_id ||
      !session_id ||
      !year ||
      !fees
    ) {
      throw new MissingFieldError(
        "Invalid details, please fill all necessary fields and try again"
      );
    }

    const data = await CreateData("sections", section, "section_id", id);
    return data;
  },
  update: async (section, id) => {
    // Call the function to update a product
    const data = await UpdateData("sections", section, "section_id", id);

    return data;
  },
};

module.exports = Sections;

// if (data.msg === "successfully updated") {
//       const { section_name, section_id } = data.fetchData;
//       columns.section_name = section_name;
//       const [yearlevel] = await FetchMany(
//         "year_level",
//         "section_id",
//         section_id
//       );
//       if (yearlevel.length === 0 || !yearlevel || yearlevel?.err) {
//         throw new NotFoundError("no section found");
//       }
//       const ids = yearlevel?.map((user) => user.level_id);
//       const updatePL = await UpdateMany("year_level", ids, columns, "level_id");
//       return { updatePL, data };
//     } else {
//       throw new DataError("no changes made");
//     }
