const UpdateData = require("../post-functions/updateData");
const CreateData = require("../post-functions/createData");
const createPartition = require("../post-functions/createPartition");
const { StatusCodes } = require("http-status-codes");
const deleteData = require("../post-functions/deleteData");

const Code = {
  createCode: async (code, id) => {
    // console.log(session);
    try {
      const data = await CreateData("school_code", code, "code_id", id);
      return data;
    } catch (error) {
      throw error;
    }
  },
  createGeneralTag: async (code, id) => {
    // console.log(session);
    try {
      const data = await CreateData("general_tag", code, "tag_id", id);
      return data;
    } catch (error) {
      throw error;
    }
  },
  createBranch: async (branch, id) => {
    // console.log(session);
    try {
      const data = await CreateData("branch", branch, "branch_id", id);
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
  createRole: async (role, id) => {
    // console.log(session);
    try {
      const data = await CreateData("roles", role, "role_id", id);
      return data;
    } catch (error) {
      throw error;
    }
  },
  createRolehierarchy: async (role) => {
    const { role_id, parent_role_id } = role;
    const c_key = [role_id, parent_role_id];
    try {
      const data = await CreateData(
        "role_hierarchy",
        role,
        "role_id",
        c_key,
        "parent_role_id",
        "AND"
      );
      return data;
    } catch (error) {
      throw error;
    }
  },
  createRolepermission: async (link) => {
    const { role_id, permission_id } = link;
    const c_key = [permission_id, role_id];
    try {
      const data = await CreateData(
        "roles_permission",
        link,
        "permission_id",
        c_key,
        "role_id",
        "AND"
      );
      return data;
    } catch (error) {
      throw error;
    }
  },
  createMail: async (mail, id) => {
    // console.log(session);
    try {
      const data = await CreateData("school_mail", mail, "mail_id", id);
      return data;
    } catch (error) {
      throw error;
    }
  },
  createPermission: async (permission, id) => {
    // console.log(session);
    try {
      const data = await CreateData(
        "permissions",
        permission,
        "permission_id",
        id
      );
      return data;
    } catch (error) {
      throw error;
    }
  },
  updateCode: async (code, id) => {
    // Call the function to update a produc
    try {
      const data = await UpdateData("school_code", code, "code_id", id);
      return data;
    } catch (error) {
      throw error;
    }
  },
  updateGeneralTag: async (code, id) => {
    // Call the function to update a produc
    try {
      const data = await UpdateData("general_tag", code, "tag_id", id);
      return data;
    } catch (error) {
      throw error;
    }
  },
  updateRole: async (role, id) => {
    // Call the function to update a produc
    try {
      const data = await UpdateData("roles", role, "role_id", id);
      return data;
    } catch (error) {
      throw error;
    }
  },
  deleteRolePermission: async (id) => {
    // Call the function to update a product
    try {
      const data = await deleteData(
        "roles_permission",
        "permission_id",
        id,
        "role_id",
        "AND"
      );
      return data;
    } catch (error) {
      throw error;
    }
  },
  deleteRolehierarchy: async (id) => {
    // Call the function to update a product
    try {
      const data = await deleteData(
        "role_hierarchy",
        "role_id",
        id,
        "parent_role_id",
        "AND"
      );
      return data;
    } catch (error) {
      throw error;
    }
  },
  updateBranch: async (branch, id) => {
    // Call the function to update a produc
    try {
      const data = await UpdateData("branch", branch, "branch_id", id);
      return data;
    } catch (error) {
      throw error;
    }
  },
  updateMail: async (mail, id) => {
    // Call the function to update a produc
    try {
      const data = await UpdateData("school_mail", mail, "mail_id", id);
      return data;
    } catch (error) {
      throw error;
    }
  },
  updatePermission: async (permission, id) => {
    // Call the function to update a produc
    try {
      const data = await UpdateData(
        "permissions",
        permission,
        "permission_id",
        id
      );
      return data;
    } catch (error) {
      throw error;
    }
  },
};

module.exports = Code;
