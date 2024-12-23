const CustomAPIError = require("./customApi");
const { StatusCodes } = require("http-status-codes");

class DataError extends Error {
  constructor(message) {
    super(message);
    this.name = "DataError";
    this.statusCode = StatusCodes.BAD_REQUEST;
  }
}

module.exports = DataError;
