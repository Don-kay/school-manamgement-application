const CustomAPIError = require("./customApi");
const BadRequestError = require("./BadRequest");
const NotFoundError = require("./Not-found");
const UnauthenticatedError = require("./UnauthenticatedError");
const UnauthorizedError = require("./UnauthorizedError");
const MissingFieldsError = require("./missingFieldserror");
const IdGeneratorError = require("./IdGeneratorError");
const DataError = require("./dataError");
const Success = require("./success");

module.exports = {
  CustomAPIError,
  BadRequestError,
  NotFoundError,
  UnauthenticatedError,
  UnauthorizedError,
  MissingFieldsError,
  IdGeneratorError,
  DataError,
  Success,
};
