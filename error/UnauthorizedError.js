const CustomAPIError = require("./customApi");
const { StatusCodes } = require("http-status-codes");

class UnauthorizedError extends Error {
  constructor(message) {
    super(`${message}`);
    this.name = "UnauthorizedError";
    this.statusCode = StatusCodes.UNAUTHORIZED;
  }
}

module.exports = UnauthorizedError;
