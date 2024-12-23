const CustomAPIError = require("./customApi");
const { StatusCodes } = require("http-status-codes");

class IDGenerationError extends Error {
  constructor(message) {
    super(message);
    this.name = "IDGenerationError";
    this.statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  }
}

module.exports = IDGenerationError;
