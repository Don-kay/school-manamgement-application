const { StatusCodes } = require("http-status-codes");
const CustomApiError = require("./customApi");

class BadRequestError extends Error {
  constructor(message) {
    super(message);
    this.name = "BadRequest Error";
    this.statusCode = StatusCodes.BAD_REQUEST;
  }
}

module.exports = BadRequestError;
