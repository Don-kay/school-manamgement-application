const { StatusCodes } = require("http-status-codes");

const notFound = (req, res) =>
  res.status(StatusCodes.NOT_FOUND).send("Sorry, Route doesn't exist");

module.exports = notFound;
