const CustomAPIError = require("./customApi");
const { StatusCodes } = require("http-status-codes");

class UnauthenticatedError extends Error {
  constructor(message) {
    super(message);
    this.name = "Unauthenticated Error";
    this.statusCode = StatusCodes.UNAUTHORIZED;
  }
}

module.exports = UnauthenticatedError;
