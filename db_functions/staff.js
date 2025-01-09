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
const AssignStaffToBranch = require("../post-functions/functions/assignStaffToBranch");

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
  create: async (user, staff_id, hqPool) => {
    const data = await CreateData("staff", user, "staff_id", staff_id, hqPool);
    return data;
  },
  update: async (user, id, hqPool, branchPool, hqid, staffBranchid) => {
    let syncData;
    const fieldsToCompare = [
      "firstname",
      "official_email",
      "role_id",
      "branch_id",
    ];
    // Build the query to only select relevant columns
    const getUserQuery = `SELECT ${fieldsToCompare} FROM staff WHERE staff_id = ?`;

    const [fetchSelected] = await hqPool.query(getUserQuery, [id]);

    const selectedData = fetchSelected[0];

    const data = await UpdateData("staff", user, "staff_id", id, hqPool);

    if (hqid !== staffBranchid) {
      syncData = await UpdateData("staff", data, "staff_id", id, branchPool);
    }

    const { firstname, official_email, role_id, branch_id } = data;

    const updatedData = { firstname, official_email, role_id, branch_id };

    const checkUpdated = await updateUserDetails(
      fieldsToCompare,
      updatedData,
      selectedData
    );

    if (checkUpdated === "vital detail changed.") {
      const logout = await logoutJwt(id, branchPool);
      return { logout, syncData };
    }

    return syncData;
  },
  updateOfficialMail: async (
    user,
    id,
    hqPool,
    branchPool,
    hqid,
    staffBranchid
  ) => {
    let syncData;
    const data = await UpdateData("staff", user, "staff_id", id, hqPool);

    if (hqid !== staffBranchid) {
      syncData = await UpdateData("staff", data, "staff_id", id, branchPool);
    }

    const logout = await logoutJwt(id, branchPool);

    return { logout, syncData };
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
