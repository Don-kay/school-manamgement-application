const AuxillaryFunction = require("../db_functions/auxilliary");
const generateUUId = require("../post-functions/functions/generateUuid");
const checkId = require("../post-functions/functions/checksingleExistence");
const { StatusCodes } = require("http-status-codes");
const { DataError, BadRequestError, NotFoundError } = require("../error");
const GenerateSchoolCode = require("../post-functions/functions/generateschoolCode");
const fetchallExistence = require("../post-functions/fetchallExistence");
const checkallExistence = require("../post-functions/functions/checkallExistence");
const FetchSingleData = require("../post-functions/fetchSingleInputedData");
const checkoneExistence = require("../post-functions/functions/checkoneExistence");
const MissingFieldError = require("../error/missingFieldserror");

const branchCodeController = async (req, res, next) => {
  try {
    const { branchid: branch_id, alias } = req.params;

    if (!branch_id) {
      return next(
        new DataError("Unable to complete request, please specify a branch.")
      );
    }

    const [data] = await fetchallExistence("academic_session", {
      current: "true",
    });

    const branchData = await checkallExistence(
      "branch",
      { branch_id, alias },
      "AND"
    );

    if (!data) {
      return next(
        new NotFoundError("sorry, no current year set, please contact support")
      );
    }

    if (!branchData) {
      return next(
        new NotFoundError(
          "Branch does not exist, check the entry and try again. If error persist, contact support"
        )
      );
    }

    const session_id = data.session_id;
    const year = data.session;

    const checkCodeExists = await checkallExistence(
      "branch_code",
      { session_id, branch_id },
      "AND"
    );

    if (checkCodeExists) {
      return next(
        new BadRequestError("Duplicate code entry, school_code exists")
      );
    }

    const code_id = await generateUUId("branch_code", "code_id", "CODE");

    if (
      code_id === "failed to generate unique id after 10 attempts" ||
      !code_id
    ) {
      return next(
        new BadRequestError(
          "Failed to generate unique code ID, please try again."
        )
      );
    }

    const codeProps = {
      code_id,
      session_id,
      branch_id,
      year,
    };

    const createdCode = await AuxillaryFunction.createCode(codeProps, code_id);

    return res.status(StatusCodes.CREATED).json(createdCode);
  } catch (error) {
    next(error);
  }
};
const staffCodeController = async (req, res, next) => {
  const data = await generateUUId("staff_code", "code_id", "STAFFCODE");
  const staffCode = await GenerateSchoolCode("staff_code", "code");
  const [generalCode] = await fetchallExistence("general_code", {
    current: "true",
  });

  const serial_key = `${generalCode.code}/${staffCode}`;
  const code_id =
    data === "failed to generate unique id after 10 attempts" ? null : data;
  req.body.code_id = code_id;
  req.body.serial_key = serial_key;
  req.body.code = generalCode;
  //console.log(req.body);
  try {
    if (
      data === null ||
      data === "failed to generate unique id after 10 attempts" ||
      !code_id
    ) {
      throw new BadRequestError(
        "failed to generate staffcodeId, duplicate id error::) or try to provide a parent"
      );
    }
    const codeProp = await AuxillaryFunction.createStaffCode(req.body, code_id);
    return res.status(StatusCodes.CREATED).json(codeProp);
  } catch (error) {
    // console.log(error);
    next(error);
  }
};
const BranchController = async (req, res, next) => {
  const { branch_name, alias, db_access } = req.body;

  const branch_id = await generateUUId("branch", "branch_id", "BRANCH");

  //console.log(req.body);
  try {
    const [data] = await fetchallExistence("academic_session", {
      current: "true",
    });

    if (!data) {
      return next(
        new NotFoundError("sorry, no current year set, please contact support")
      );
    }

    const session_id = data.session_id;
    const year = data.session;

    if (!db_access) {
      return next(
        new MissingFieldError("missing field. please, fill in all fields")
      );
    }

    if (
      branch_id === "failed to generate unique id after 10 attempts" ||
      !branch_id
    ) {
      return next(
        new BadRequestError(
          "Failed to generate unique branch ID, please try again."
        )
      );
    }

    const code = await GenerateSchoolCode("branch", "code");

    const checkBranchExist = await checkallExistence(
      "branch",
      {
        branch_name,
        code,
        alias,
      },
      "OR"
    );

    req.body = { ...req.body, branch_id, code, year, session_id };

    if (checkBranchExist) {
      throw new DataError(
        `duplicate entries : values exist, please verify entries`
      );
    }

    const branchProp = await AuxillaryFunction.createBranch(
      req.body,
      branch_id
    );
    return res.status(StatusCodes.CREATED).json(branchProp);
  } catch (error) {
    // console.log(error);
    next(error);
  }
};
const schoolMailController = async (req, res, next) => {
  //console.log(req.body);
  try {
    const mail_id = await generateUUId("school_mail", "mail_id", "MAIL");

    if (mail_id === "failed to generate unique id after 10 attempts") {
      throw new Error("Failed to generate a unique subject ID");
    }

    // Check if there is a current academic year already
    const currentSession = await fetchallExistence("academic_session", {
      current: "true",
    });

    const year = currentSession?.[0]?.session;

    if (
      data === null ||
      data === "failed to generate unique id after 10 attempts" ||
      !mail_id
    ) {
      throw new BadRequestError(
        "failed to generate userId, duplicate id error::) or try to provide a parent"
      );
    }
    req.body = { ...req.body, mail_id, year };

    const mailProp = await AuxillaryFunction.createMail(req.body, mail_id);
    return res.status(StatusCodes.CREATED).json(mailProp);
  } catch (error) {
    // console.log(error);
    next(error);
  }
};
const GeneralTagController = async (req, res, next) => {
  try {
    const code_id = await generateUUId("general_tag", "tag_id", "GENERAL");

    const currentSession = await fetchallExistence("academic_session", {
      current: "true",
    });

    if (
      !code_id ||
      code_id === "failed to generate unique id after 10 attempts"
    ) {
      throw new BadRequestError(
        "failed to generate tag_Id, duplicate id error::) or try to provide a parent"
      );
    }

    if (!currentSession) {
      return next(
        new NotFoundError("sorry, no current year set, please contact support")
      );
    }

    req.body.code_id = code_id;

    const codeProp = await AuxillaryFunction.createGeneralTag(
      req.body,
      code_id
    );

    return res.status(StatusCodes.CREATED).json(codeProp);
  } catch (error) {
    // console.log(error);
    next(error);
  }
};
const rolesController = async (req, res, next) => {
  const role_id = await generateUUId("roles", "role_id", "ROLE");

  try {
    const [data] = await fetchallExistence("academic_session", {
      current: "true",
    });

    if (!data) {
      return next(
        new NotFoundError("sorry, no current year set, please contact support")
      );
    }

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

    const roleProp = await AuxillaryFunction.createRole(req.body, role_id);
    return res.status(StatusCodes.CREATED).json(roleProp);
  } catch (error) {
    // console.log(error);
    next(error);
  }
};
const rolesHierarchyController = async (req, res, next) => {
  try {
    const [data] = await fetchallExistence("academic_session", {
      current: "true",
    });

    if (!data) {
      return next(
        new NotFoundError("sorry, no current year set, please contact support")
      );
    }

    const session_id = data.session_id;
    const year = data.session;

    req.body = { ...req.body, session_id, year };

    const roleProp = await AuxillaryFunction.createRolehierarchy(req.body);
    return res.status(StatusCodes.CREATED).json(roleProp);
  } catch (error) {
    // console.log(error);
    next(error);
  }
};
const rolesPermissionController = async (req, res, next) => {
  try {
    const [data] = await fetchallExistence("academic_session", {
      current: "true",
    });

    if (!data) {
      return next(
        new NotFoundError("sorry, no current year set, please contact support")
      );
    }

    const session_id = data.session_id;
    const year = data.session;

    req.body = { ...req.body, session_id, year };

    const roleProp = await AuxillaryFunction.createRolepermission(req.body);
    return res.status(StatusCodes.CREATED).json(roleProp);
  } catch (error) {
    // console.log(error);
    next(error);
  }
};
const permissionController = async (req, res, next) => {
  const permission_id = await generateUUId(
    "permissions",
    "permission_id",
    "PERMIT"
  );

  try {
    const [data] = await fetchallExistence("academic_session", {
      current: "true",
    });

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
      permission_id
    );

    return res.status(StatusCodes.CREATED).json(permissionProp);
  } catch (error) {
    // console.log(error);
    next(error);
  }
};
const updateBranchcodeController = async (req, res, next) => {
  const { codeid: code_id, branchid, alias } = req.params;

  const { branch_id } = req.body;

  try {
    if (!branch_id) {
      return next(new MissingFieldError("fields must not be empty"));
    }

    const branchData = await checkallExistence(
      "branch",
      { branch_id: branchid, alias },
      "AND"
    );

    const authorize = await checkallExistence(
      "branch_code",
      { code_id, branch_id: branchid },
      "AND"
    );

    const isLinked = await checkallExistence(
      "branch_code",
      { code_id, branch_id },
      "AND"
    );

    if (isLinked) {
      return next(new DataError("branch already linked to this code"));
    }

    if (!branchData) {
      return next(
        new NotFoundError(
          "Branch with request combination not found, invalid request"
        )
      );
    }

    if (!authorize) {
      throw new BadRequestError(`fatal error ::) unauthorized to make updates`);
    }

    const codeId = await AuxillaryFunction.updateCode(req.body, code_id);

    res.status(StatusCodes.OK).json({ codeId });
  } catch (error) {
    next(error);
  }
};
const updateBranchController = async (req, res, next) => {
  const { branchid: branch_id, alias } = req.params;
  console.log(req.params);
  try {
    const branchExist = await checkallExistence(
      "branch",
      { branch_id, alias },
      "AND"
    );

    if (!branchExist) {
      return next(
        new NotFoundError(
          "invalid request ::) Branch with request combination not found."
        )
      );
    }

    const branchProp = await AuxillaryFunction.updateBranch(
      req.body,
      branch_id
    );
    // console.log(userId);
    res.status(StatusCodes.OK).json({ branchProp });
  } catch (error) {
    next(error);
  }
};
const updateRoleController = async (req, res, next) => {
  const { roleid: role_id } = req.params;

  try {
    const idPresent = await checkoneExistence("roles", "role_id", role_id);

    if (!idPresent) {
      return next(new DataError(`role with id: ${role_id}  doesn't exist`));
    }

    const roleId = await AuxillaryFunction.updateRole(req.body, role_id);

    return res.status(StatusCodes.OK).json({ roleId });
  } catch (error) {
    next(error);
  }
};
const deleteRolehierarachyController = async (req, res, next) => {
  const { roleid: role_id, paRole: parent_role_id } = req.params;

  try {
    const heirarchy = await checkallExistence(
      "role_hierarchy",
      { role_id, parent_role_id },
      "AND"
    );

    if (!heirarchy) {
      return next(
        new DataError(
          `hierachy with roleid: ${role_id} and parent_role_id: ${parent_role_id} doesn't exist`
        )
      );
    }

    const c_key = [role_id, parent_role_id];

    const roleId = await AuxillaryFunction.deleteRolehierarchy(c_key);

    return res.status(StatusCodes.OK).json({ roleId });
  } catch (error) {
    next(error);
  }
};
const deleteRolePermissionController = async (req, res, next) => {
  const { permid: permission_id, roleid: role_id } = req.params;

  try {
    const rolePermit = await checkallExistence(
      "roles_permission",
      { permission_id, role_id },
      "AND"
    );

    if (!rolePermit) {
      return next(
        new DataError(
          `rolePermit with roleid: ${role_id} and parent_role_id: ${permission_id} doesn't exist`
        )
      );
    }

    const c_key = [permission_id, role_id];

    const roleId = await AuxillaryFunction.deleteRolePermission(c_key);

    return res.status(StatusCodes.OK).json({ roleId });
  } catch (error) {
    next(error);
  }
};
const updateGeneralTagController = async (req, res, next) => {
  const { tagid: tag_id } = req.params;

  try {
    const idPresent = await checkoneExistence("general_tag", "tag_id", tag_id);

    if (!idPresent) {
      throw new DataError(
        "Invalid tag id information. Please verify and try again."
      );
    }
    const codeId = await AuxillaryFunction.updateGeneralTag(req.body, tag_id);

    return res.status(StatusCodes.OK).json({ codeId });
  } catch (error) {
    next(error);
  }
};
const updateSchoolMailController = async (req, res, next) => {
  const { mailid: mail_id } = req.params;
  const idPresent = await checkId("school_mail", "mail_id", mail_id);
  try {
    if (idPresent.err === 404) {
      throw new DataError(`mail with id: ${role_id}  doesn't exist`);
    }
    const mailId = await AuxillaryFunction.updateMail(req.body, mail_id);
    // console.log(userId);
    return res.status(StatusCodes.OK).json({ mailId });
  } catch (error) {
    next(error);
  }
};
const updateStaffCodeController = async (req, res, next) => {
  const { codeid: code_id, branchid: branch_id } = req.params;
  const { branchc_id } = req.body;
  const idPresent = await checkId("staff_code", "code_id", code_id);
  try {
    if (idPresent.err === 404) {
      throw new DataError(`code with id: ${code_id}  doesn't exist`);
    }
    const codeId = await AuxillaryFunction.updateStaffCode(req.body, code_id);
    // console.log(userId);
    return res.status(StatusCodes.OK).json({ codeId });
  } catch (error) {
    next(error);
  }
};
const updatePermissionController = async (req, res, next) => {
  const { permissionid: permission_id } = req.params;

  try {
    const idPresent = await checkoneExistence(
      "permission",
      "permission_id",
      permission_id
    );

    if (!idPresent) {
      throw new DataError(
        `permission with id: ${permission_id}  doesn't exist`
      );
    }

    const permissionId = await AuxillaryFunction.updatePermission(
      req.body,
      permission_id
    );

    return res.status(StatusCodes.OK).json({ permissionId });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  branchCodeController,
  updateBranchcodeController,
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
  staffCodeController,
  updateStaffCodeController,
  updateGeneralTagController,
  BranchController,
  updateBranchController,
};
