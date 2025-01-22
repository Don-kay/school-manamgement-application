const { StatusCodes } = require("http-status-codes");
const { UnauthenticatedError, BadRequestError } = require("../error/index");
const FetchSingleData = require("../post-functions/fetchSingleInputedData");
const getUserPermissions = require("./getUserPermission");

const AuthenticateRoles = (permission) => {
  return async (req, res, next) => {
    const roleid = req.staff?.staff_id;

    const staffPermissions = await getUserPermissions(roleid);
    if (staffPermissions === 1054) {
      return next(new BadRequestError("something went wrong, contact support"));
    }
    if (
      staffPermissions.some((permissions) => permissions.name === permission)
    ) {
      next(); // User has the required permission, proceed
    } else {
      return next(
        new UnauthenticatedError(
          "Access denied: insufficient permission to perform action"
        )
      );
    }
  };
};

module.exports = AuthenticateRoles;
