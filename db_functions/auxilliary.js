const UpdateData = require("../post-functions/updateData");
const CreateData = require("../post-functions/createData");
const createPartition = require("../post-functions/createPartition");
const { StatusCodes } = require("http-status-codes");
const deleteData = require("../post-functions/deleteData");
const {
  FilterAllowedFields,
} = require("../post-functions/functions/filterAllowedFields");

const Aux = {
  createGeneralTag: async (tag, id, hqPool) => {
    // console.log(session);
    try {
      const data = await CreateData("general_tag", tag, "tag_id", id, hqPool);
      return data;
    } catch (error) {
      throw error;
    }
  },
  createPartition: async (branch, id) => {
    // Call the function to update a produc
    try {
      const data = await createPartition("parents", branch, "code_id", id);
      return data;
    } catch (error) {
      throw error;
    }
  },
  createRole: async (role, id, hqPool) => {
    // console.log(session);
    try {
      const data = await CreateData("roles", role, "role_id", id, hqPool);
      return data;
    } catch (error) {
      throw error;
    }
  },
  createRolehierarchy: async (role, hqPool) => {
    const { role_id, parent_role_id } = role;
    const c_key = [role_id, parent_role_id];
    try {
      const data = await CreateData(
        "role_hierarchy",
        role,
        "role_id",
        c_key,
        hqPool,
        "parent_role_id",
        "AND"
      );
      return data;
    } catch (error) {
      throw error;
    }
  },
  createRolepermission: async (link, hqPool) => {
    const { role_id, permission_id } = link;
    const c_key = [permission_id, role_id];
    try {
      const data = await CreateData(
        "roles_permission",
        link,
        "permission_id",
        c_key,
        hqPool,
        "role_id",
        "AND"
      );
      return data;
    } catch (error) {
      throw error;
    }
  },
  createMail: async (mail, id, hqPool) => {
    // console.log(session);
    try {
      const data = await CreateData("school_mail", mail, "mail_id", id, hqPool);
      return data;
    } catch (error) {
      throw error;
    }
  },
  createPermission: async (permission, id, hqPool) => {
    // console.log(session);
    try {
      const data = await CreateData(
        "permissions",
        permission,
        "permission_id",
        id,
        hqPool
      );
      return data;
    } catch (error) {
      throw error;
    }
  },
  updateGeneralTag: async (tag, id, hqPool) => {
    // Call the function to update a produc
    try {
      const data = await UpdateData("general_tag", tag, "tag_id", id, hqPool);
      return data;
    } catch (error) {
      throw error;
    }
  },
  updateRole: async (role, id, hqPool) => {
    // Call the function to update a produc
    try {
      const data = await UpdateData("roles", role, "role_id", id, hqPool);
      return data;
    } catch (error) {
      throw error;
    }
  },
  deleteRolePermission: async (id, hqPool) => {
    // Call the function to update a product
    try {
      const data = await deleteData(
        "roles_permission",
        "permission_id",
        id,
        hqPool,
        "role_id",
        "AND"
      );
      return data;
    } catch (error) {
      throw error;
    }
  },
  deleteRolehierarchy: async (id, hqPool) => {
    // Call the function to update a product
    try {
      const data = await deleteData(
        "role_hierarchy",
        "role_id",
        id,
        hqPool,
        "parent_role_id",
        "AND"
      );
      return data;
    } catch (error) {
      throw error;
    }
  },
  updateBranch: async (branch, id, hqPool, branchPool) => {
    // Call the function to update a produc
    try {
      const data = await UpdateData("branch", branch, "branch_id", id, hqPool);

      const allowedFields = [
        "branch_id",
        "branch_name",
        "address",
        "head_teacher",
        "region",
        "country",
        "state",
        "alias",
        "code",
        "session_id",
        "year",
        "created_At",
        "updated_At",
      ];
      const filteredFields = FilterAllowedFields(data, allowedFields);
      const syncUpdate = await UpdateData(
        "branch",
        filteredFields,
        "branch_id",
        id,
        branchPool
      );

      return syncUpdate;
    } catch (error) {
      throw error;
    }
  },
  updateMail: async (mail, id, hqPool) => {
    // Call the function to update a produc
    try {
      const data = await UpdateData("school_mail", mail, "mail_id", id, hqPool);
      return data;
    } catch (error) {
      throw error;
    }
  },
  updatePermission: async (permission, id, hqPool) => {
    // Call the function to update a produc
    try {
      const data = await UpdateData(
        "permissions",
        permission,
        "permission_id",
        id,
        hqPool
      );
      return data;
    } catch (error) {
      throw error;
    }
  },
};

module.exports = Aux;
