const AuxillaryFunction = require("../db_functions/auxilliary");
const generateUUId = require("../post-functions/functions/generateUuid");
const checkId = require("../post-functions/functions/checksingleExistence");
const { StatusCodes } = require("http-status-codes");
const { masterPool, getBranchPool } = require("../config/connection");
const {
  DataError,
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} = require("../error");
const fetchallExistence = require("../post-functions/fetchallExistence");
const checkallExistence = require("../post-functions/functions/checkallExistence");
const checkoneExistence = require("../post-functions/functions/checkoneExistence");
const MissingFieldError = require("../error/missingFieldserror");
const checkallDBExistence = require("../post-functions/branchDB/checkallDBExistence");
const {
  FilterAllowedFields,
} = require("../post-functions/functions/filterAllowedFields");
const {
  beginTransaction,
  rollbackTransaction,
  commitTransaction,
} = require("../post-functions/functions/dbTransactionHelper");
const updateData = require("../post-functions/updateData");

const rolesController = async (req, res, next) => {
  const { hqid } = req.params;
  const hqPool = req.branchPool;

  try {
    const isHQ = await checkallDBExistence(
      "branches",
      { branch_id: hqid, hq: "true" },
      "AND"
    );
    if (!isHQ) {
      return next(new UnauthorizedError("invalid HQ access"));
    }

    const [data] = await fetchallExistence(
      "academic_session",
      {
        current: "true",
      },
      hqPool
    );

    if (!data) {
      return next(
        new NotFoundError("sorry, no current year set, please contact support")
      );
    }
    const role_id = await generateUUId("roles", "role_id", "ROLE", hqPool);

    const session_id = data.session_id;
    const year = data.session;

    if (
      !role_id ||
      role_id === "failed to generate unique id after 10 attempts"
    ) {
      return next(
        new BadRequestError(
          "Failed to generate a unique staff ID. Please try again."
        )
      );
    }

    req.body = { ...req.body, role_id, session_id, year };

    const roleProp = await AuxillaryFunction.createRole(
      req.body,
      role_id,
      hqPool
    );
    return res.status(StatusCodes.CREATED).json(roleProp);
  } catch (error) {
    // console.log(error);
    return next(error);
  }
};
const updateRoleController = async (req, res, next) => {
  const { hqid, roleid: role_id } = req.params;

  const hqPool = req.branchPool;

  try {
    const isHQ = await checkallDBExistence(
      "branches",
      { branch_id: hqid, hq: "true" },
      "AND"
    );
    if (!isHQ) {
      return next(new UnauthorizedError("invalid HQ access"));
    }

    const roleExist = await checkoneExistence(
      "roles",
      "role_id",
      role_id,
      hqPool
    );

    if (!roleExist) {
      return next(new NotFoundError(`role with id: ${role_id}  doesn't exist`));
    }

    const roleId = await AuxillaryFunction.updateRole(
      req.body,
      role_id,
      hqPool
    );

    return res.status(StatusCodes.OK).json({ roleId });
  } catch (error) {
    return next(error);
  }
};

const schoolMailController = async (req, res, next) => {
  const { hqid } = req.params;
  const { current } = req.body;

  const hqPool = req.branchPool;

  let hqConnection;

  hqConnection = await beginTransaction(hqPool);

  //console.log(req.body);
  try {
    const isHQ = await checkallDBExistence(
      "branches",
      { branch_id: hqid, hq: "true" },
      "AND"
    );

    if (!isHQ) {
      return next(new UnauthorizedError("invalid HQ access"));
    }

    const isCurrent = current === "true";

    const existingMailTemplate = await fetchallExistence(
      "school_mail",
      {
        current: "true",
      },
      hqConnection
    );

    const currentMailId = existingMailTemplate?.[0]?.mail_id;

    if (isCurrent && currentMailId) {
      const data = await updateData(
        "school_mail",
        { current: "false" },
        "mail_id",
        currentMailId,
        hqConnection
      );

      if (!data || Object.keys(data).length === 0) {
        return next(new DataError("failed to update, try again later"));
      }

      // Set the current flag appropriately
      req.body.current = "true";
    } else if (!isCurrent && !currentMailId) {
      req.body.current = "true";
    }

    const mail_id = await generateUUId(
      "school_mail",
      "mail_id",
      "MAIL",
      hqConnection
    );

    if (
      mail_id === null ||
      mail_id === "failed to generate unique id after 10 attempts" ||
      !mail_id
    ) {
      return next(new Error("Failed to generate a unique mail ID"));
    }

    // Check if there is a current academic year already
    const currentSession = await fetchallExistence(
      "academic_session",
      {
        current: "true",
      },
      masterPool
    );

    const year = currentSession?.[0]?.session;
    const session_id = currentSession?.[0]?.session_id;

    req.body = { ...req.body, mail_id, year, session_id };

    const mailProp = await AuxillaryFunction.createMail(
      req.body,
      mail_id,
      hqConnection
    );
    return res.status(StatusCodes.CREATED).json(mailProp);
  } catch (error) {
    // console.log(error);
    return next(error);
  }
};
const GeneralTagController = async (req, res, next) => {
  const { hqid } = req.params;
  const { current } = req.body;

  const hqPool = req.branchPool;

  let hqConnection;

  hqConnection = await beginTransaction(hqPool);

  try {
    const isHQ = await checkallDBExistence(
      "branches",
      { branch_id: hqid, hq: "true" },
      "AND"
    );

    if (!isHQ) {
      return next(new UnauthorizedError("invalid HQ access"));
    }

    const isCurrent = current === "true";

    const existingTag = await fetchallExistence(
      "general_tag",
      {
        current: "true",
      },
      hqConnection
    );

    const currentTagId = existingTag?.[0]?.tag_id;

    if (isCurrent && currentTagId) {
      const data = await updateData(
        "general_tag",
        { current: "false" },
        "tag_id",
        currentTagId,
        hqConnection
      );

      if (!data || Object.keys(data).length === 0) {
        return next(new DataError("failed to update, try again later"));
      }

      // Set the current flag appropriately
      req.body.current = "true";
    } else if (!isCurrent && !currentTagId) {
      req.body.current = "true";
    }

    const tag_id = await generateUUId(
      "general_tag",
      "tag_id",
      "GENERAL",
      hqConnection
    );

    if (
      tag_id === null ||
      tag_id === "failed to generate unique id after 10 attempts" ||
      !tag_id
    ) {
      return next(new Error("Failed to generate a unique tag ID"));
    }

    const currentSession = await fetchallExistence(
      "academic_session",
      {
        current: "true",
      },
      masterPool
    );

    if (!currentSession) {
      return next(
        new NotFoundError("sorry, no current year set, please contact support")
      );
    }

    const year = currentSession?.[0]?.session;
    const session_id = currentSession?.[0]?.session_id;

    req.body = { ...req.body, tag_id: tag_id, year, session_id };

    const tagProp = await AuxillaryFunction.createGeneralTag(
      req.body,
      tag_id,
      hqConnection
    );

    await commitTransaction(hqConnection);

    return res.status(StatusCodes.CREATED).json(tagProp);
  } catch (error) {
    if (hqConnection) await rollbackTransaction(hqConnection);
    // console.log(error);
    return next(error);
  }
};

const updateBranchController = async (req, res, next) => {
  const { hqid, branchid: branch_id, alias } = req.params;

  const branchPool = await getBranchPool(branch_id);
  const hqPool = req.branchPool;

  //hqid graps the hq db, while branch_id graps the branch pool to push the sync updates

  let branchConnection, hqConnection;

  hqConnection = await beginTransaction(hqPool);
  branchConnection = await beginTransaction(branchPool);

  try {
    const isHQ = await checkallDBExistence(
      "branches",
      { branch_id: hqid, hq: "true" },
      "AND"
    );
    if (!isHQ) {
      return next(new UnauthorizedError("invalid HQ access"));
    }

    const branchExist = await checkallExistence(
      "branch",
      { branch_id, alias },
      "AND",
      hqConnection
    );

    if (!branchExist) {
      return next(
        new NotFoundError(
          "invalid request ::) Branch with request combination not found."
        )
      );
    }

    const allowedFields = [
      "region",
      "address",
      "head_teacher",
      "country",
      "state",
    ]; // Define allowed fields
    const filteredBody = FilterAllowedFields(req.body, allowedFields);

    if (Object.keys(filteredBody).length === 0) {
      return next(new DataError("No valid fields provided for update"));
    }

    const branchProp = await AuxillaryFunction.updateBranch(
      req.body,
      branch_id,
      hqConnection,
      branchConnection
    );

    await commitTransaction(branchConnection);
    await commitTransaction(hqConnection);
    // console.log(userId);
    return res.status(StatusCodes.OK).json({ branchProp });
  } catch (error) {
    if (branchConnection) await rollbackTransaction(branchConnection);
    if (hqConnection) await rollbackTransaction(hqConnection);
    return next(error);
  }
};

const rolesHierarchyController = async (req, res, next) => {
  const { hqid } = req.params;

  const hqPool = req.branchPool;

  try {
    const isHQ = await checkallDBExistence(
      "branches",
      { branch_id: hqid, hq: "true" },
      "AND"
    );

    if (!isHQ) {
      return next(new UnauthorizedError("invalid HQ access"));
    }

    const [data] = await fetchallExistence(
      "academic_session",
      {
        current: "true",
      },
      hqPool
    );

    if (!data) {
      return next(
        new NotFoundError("sorry, no current year set, please contact support")
      );
    }

    const session_id = data.session_id;
    const year = data.session;

    req.body = { ...req.body, session_id, year };

    const roleProp = await AuxillaryFunction.createRolehierarchy(
      req.body,
      hqPool
    );
    return res.status(StatusCodes.CREATED).json(roleProp);
  } catch (error) {
    // console.log(error);
    return next(error);
  }
};
const deleteRolehierarachyController = async (req, res, next) => {
  const { hqid, roleid: role_id, paRole: parent_role_id } = req.params;
  const hqPool = req.branchPool;

  try {
    const isHQ = await checkallDBExistence(
      "branches",
      { branch_id: hqid, hq: "true" },
      "AND"
    );

    if (!isHQ) {
      return next(new UnauthorizedError("invalid HQ access"));
    }

    const heirarchy = await checkallExistence(
      "role_hierarchy",
      { role_id, parent_role_id },
      "AND",
      hqPool
    );

    if (!heirarchy) {
      return next(
        new DataError(
          `hierachy with roleid: ${role_id} and parent_role_id: ${parent_role_id} doesn't exist`
        )
      );
    }

    const c_key = [role_id, parent_role_id];

    const roleId = await AuxillaryFunction.deleteRolehierarchy(c_key, hqPool);

    return res.status(StatusCodes.OK).json({ roleId });
  } catch (error) {
    return next(error);
  }
};

const rolesPermissionController = async (req, res, next) => {
  const { hqid } = req.params;

  const hqPool = req.branchPool;

  try {
    const isHQ = await checkallDBExistence(
      "branches",
      { branch_id: hqid, hq: "true" },
      "AND"
    );

    if (!isHQ) {
      return next(new UnauthorizedError("invalid HQ access"));
    }

    const [data] = await fetchallExistence(
      "academic_session",
      {
        current: "true",
      },
      hqPool
    );

    if (!data) {
      return next(
        new NotFoundError("sorry, no current year set, please contact support")
      );
    }

    const session_id = data.session_id;
    const year = data.session;

    req.body = { ...req.body, session_id, year };

    const roleProp = await AuxillaryFunction.createRolepermission(
      req.body,
      hqPool
    );
    return res.status(StatusCodes.CREATED).json(roleProp);
  } catch (error) {
    // console.log(error);
    return next(error);
  }
};
const deleteRolePermissionController = async (req, res, next) => {
  const { hqid, permid: permission_id, roleid: role_id } = req.params;
  const hqPool = req.branchPool;

  try {
    const isHQ = await checkallDBExistence(
      "branches",
      { branch_id: hqid, hq: "true" },
      "AND"
    );

    if (!isHQ) {
      return next(new UnauthorizedError("invalid HQ access"));
    }

    const rolePermit = await checkallExistence(
      "roles_permission",
      { permission_id, role_id },
      "AND",
      hqPool
    );

    if (!rolePermit) {
      return next(
        new DataError(
          `rolePermit with roleid: ${role_id} and parent_role_id: ${permission_id} doesn't exist`
        )
      );
    }

    const c_key = [permission_id, role_id];

    const roleId = await AuxillaryFunction.deleteRolePermission(c_key, hqPool);

    return res.status(StatusCodes.OK).json({ roleId });
  } catch (error) {
    next(error);
  }
};
const permissionController = async (req, res, next) => {
  const { hqid } = req.params;

  const hqPool = req.branchPool;

  const permission_id = await generateUUId(
    "permissions",
    "permission_id",
    "PERMIT",
    hqPool
  );

  try {
    const isHQ = await checkallDBExistence(
      "branches",
      { branch_id: hqid, hq: "true" },
      "AND"
    );

    if (!isHQ) {
      return next(new UnauthorizedError("invalid HQ access"));
    }

    const [data] = await fetchallExistence(
      "academic_session",
      {
        current: "true",
      },
      hqPool
    );

    if (!data) {
      return next(
        new NotFoundError("sorry, no current year set, please contact support")
      );
    }

    const session_id = data.session_id;
    const year = data.session;

    if (
      !permission_id ||
      permission_id === "failed to generate unique id after 10 attempts"
    ) {
      throw new BadRequestError(
        "failed to generate userId, duplicate id error::) or try to provide a parent"
      );
    }

    req.body = { ...req.body, permission_id, session_id, year };

    const permissionProp = await AuxillaryFunction.createPermission(
      req.body,
      permission_id,
      hqPool
    );

    return res.status(StatusCodes.CREATED).json(permissionProp);
  } catch (error) {
    // console.log(error);
    next(error);
  }
};
const updatePermissionController = async (req, res, next) => {
  const { hqid, permissionid: permission_id } = req.params;

  const hqPool = req.branchPool;
  try {
    const isHQ = await checkallDBExistence(
      "branches",
      { branch_id: hqid, hq: "true" },
      "AND"
    );

    if (!isHQ) {
      return next(new UnauthorizedError("invalid HQ access"));
    }

    const idPresent = await checkoneExistence(
      "permission",
      "permission_id",
      permission_id,
      hqPool
    );

    if (!idPresent) {
      return next(
        new DataError(`permission with id: ${permission_id}  doesn't exist`)
      );
    }

    const permissionId = await AuxillaryFunction.updatePermission(
      req.body,
      permission_id,
      hqPool
    );

    return res.status(StatusCodes.OK).json({ permissionId });
  } catch (error) {
    next(error);
  }
};

const updateGeneralTagController = async (req, res, next) => {
  const { hqid, tagid: tag_id } = req.params;

  const { current } = req.body;

  const hqPool = req.branchPool;

  let hqConnection;

  hqConnection = await beginTransaction(hqPool);

  try {
    const isHQ = await checkallDBExistence(
      "branches",
      { branch_id: hqid, hq: "true" },
      "AND"
    );

    if (!isHQ) {
      return next(new UnauthorizedError("invalid HQ access"));
    }

    const tagExist = await checkoneExistence(
      "general_tag",
      "tag_id",
      tag_id,
      hqConnection
    );

    if (!tagExist) {
      return next(
        new DataError(
          "Invalid tag id information. Please verify and try again."
        )
      );
    }

    if (!tagExist) {
      return next(
        new BadRequestError(
          `Failed to update, tag with id: ${tag_id} doesn't exist`
        )
      );
    }

    const isCurrentTag = current === "true";
    const existingCurrentTag = await fetchallExistence(
      "general_tag",
      {
        current: "true",
      },
      hqConnection
    );

    const currentTagId = existingCurrentTag?.[0]?.tag_id;
    // Determine if update to current session status is needed
    if (isCurrentTag && currentTagId === tag_id) {
      return next(new DataError("controller info :: No changes made"));
    } else if (!isCurrentTag && currentTagId === tag_id) {
      return next(
        new BadRequestError(
          "unable to process request ::) unset current to false not possible, try setting a new template as true"
        )
      );
    } else if (isCurrentTag && currentTagId && currentTagId !== tag_id) {
      // Update the current session to false if a different session is to be marked as current
      const data = await updateData(
        "general_tag",
        { current: "false" },
        "tag_id",
        currentTagId,
        hqConnection
      );

      if (!data || Object.keys(data).length === 0) {
        return next(new DataError("failed to update, try again later"));
      }

      req.body.current = "true";
    } else if (isCurrentTag && !currentTagId) {
      req.body.current = "true";
    } else if (!isCurrentTag && !currentTagId) {
      return next(new DataError("controller info :: No changes made"));
    }

    const tagId = await AuxillaryFunction.updateGeneralTag(
      req.body,
      tag_id,
      hqConnection
    );

    await commitTransaction(hqConnection);

    return res.status(StatusCodes.OK).json({ tagId });
  } catch (error) {
    if (hqConnection) await rollbackTransaction(hqConnection);

    return next(error);
  }
};
const updateSchoolMailController = async (req, res, next) => {
  const { hqid, mailid: mail_id } = req.params;

  const { current } = req.body;

  const hqPool = req.branchPool;

  let hqConnection;

  hqConnection = await beginTransaction(hqPool);

  try {
    const isHQ = await checkallDBExistence(
      "branches",
      { branch_id: hqid, hq: "true" },
      "AND"
    );

    if (!isHQ) {
      return next(new UnauthorizedError("invalid HQ access"));
    }

    const mailExists = await checkoneExistence(
      "school_mail",
      "mail_id",
      mail_id,
      hqConnection
    );
    if (!mailExists) {
      return next(
        new BadRequestError(
          `Failed to update, mail with id: ${mail_id} doesn't exist`
        )
      );
    }

    // Fetch current session details if needed
    const isCurrentMail = current === "true";
    const existingMailTemplate = await fetchallExistence(
      "school_mail",
      {
        current: "true",
      },
      hqConnection
    );

    const currentMailId = existingMailTemplate?.[0]?.mail_id;
    // Determine if update to current session status is needed
    if (isCurrentMail && currentMailId === mail_id) {
      return next(new DataError("controller info :: No changes made"));
    } else if (!isCurrentMail && currentMailId === mail_id) {
      return next(
        new BadRequestError(
          "unable to process request ::) unset current to false not possible, try setting a new template as true"
        )
      );
    } else if (isCurrentMail && currentMailId && currentMailId !== mail_id) {
      // Update the current session to false if a different session is to be marked as current
      const data = await updateData(
        "school_mail",
        { current: "false" },
        "mail_id",
        currentMailId,
        hqConnection
      );

      if (!data || Object.keys(data).length === 0) {
        return next(new DataError("failed to update, try again later"));
      }

      req.body.current = "true";
    } else if (isCurrentMail && !currentMailId) {
      req.body.current = "true";
    } else if (!isCurrentMail && !currentMailId) {
      return next(new DataError("controller info :: No changes made"));
    }

    const mailId = await AuxillaryFunction.updateMail(
      req.body,
      mail_id,
      hqConnection
    );
    // console.log(userId);
    return res.status(StatusCodes.OK).json({ mailId });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  rolesController,
  rolesHierarchyController,
  rolesPermissionController,
  updateRoleController,
  GeneralTagController,
  permissionController,
  updatePermissionController,
  schoolMailController,
  updateSchoolMailController,
  deleteRolehierarachyController,
  deleteRolePermissionController,
  updateGeneralTagController,
  updateBranchController,
};
