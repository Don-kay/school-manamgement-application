const { StatusCodes } = require("http-status-codes");
const CustomApiError = require("./customApi");

class Success extends Error {
  constructor(message) {
    super(message);
    this.name = "Successful";
    this.statusCode = StatusCodes.OK;
  }
}

module.exports = Success;
