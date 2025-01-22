const CustomAPIError = require("./customApi");
const { StatusCodes } = require("http-status-codes");

class MissingFieldError extends Error {
  constructor(field) {
    super(`${field}`);
    this.name = "MissingFieldError";
    this.statusCode = StatusCodes.NOT_ACCEPTABLE;
  }
}

module.exports = MissingFieldError;
