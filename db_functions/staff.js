const UpdateData = require("../post-functions/updateData");
const updateIncrement = require("../post-functions/updateIncrement");
const UpdateMany = require("../post-functions/updateMany");
const CreateData = require("../post-functions/createData");
const fetchPPlink = require("../post-functions/fetchPPlinked");
const { StatusCodes } = require("http-status-codes");
const FetchMany = require("../post-functions/fetchMany");
const { NotFoundError, DataError, MissingFieldsError } = require("../error");
const validateStaffData = require("../post-functions/functions/validateStaffData");
const updateTableColumns = require("../post-functions/updateTableColumns");
const { connection } = require("../config/connection");
const { logoutJwt } = require("../config/passwordConfig");

async function updateUserDetails(fields, updatedData, selectedData) {
  const values = [];

  // Dynamically add the fields to be updated if they are different from the current values
  for (const key of fields) {
    if (updatedData[key] !== selectedData[key]) {
      values.push(`${key}: ${updatedData[key]}`);
    }
  }
  if (values.length > 0) {
    return "vital detail changed.";
  }
  return "continue";
}

const Staff = {
  create: async (user, staff_id) => {
    const data = await CreateData("staff", user, "staff_id", staff_id);
    return data;
  },
  update: async (user, id) => {
    const fieldsToCompare = [
      "firstname",
      "official_email",
      "role_id",
      "branch_id",
    ];

    // Build the query to only select relevant columns
    const getUserQuery = `SELECT ${fieldsToCompare} FROM staff WHERE staff_id = ?`;

    const [fetchSelected] = await connection.query(getUserQuery, [id]);

    const selectedData = fetchSelected[0];

    const data = await UpdateData("staff", user, "staff_id", id);

    const {
      staff_id,
      firstname,
      surname,
      title,
      official_email,
      role_id,
      branch_id,
    } = data;

    const updatedData = { firstname, official_email, role_id, branch_id };

    const checkUpdated = await updateUserDetails(
      fieldsToCompare,
      updatedData,
      selectedData
    );

    if (checkUpdated === "vital detail changed.") {
      const logout = await logoutJwt(
        id,
        firstname,
        official_email,
        role_id,
        branch_id
      );
      return { logout, data };
    }

    return data;
  },
  setGeneralPassword: async (password, connection) => {
    const set_password = await updateTableColumns(
      "staff",
      "password",
      password,
      connection
    );

    return set_password;
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

module.exports = Staff;
