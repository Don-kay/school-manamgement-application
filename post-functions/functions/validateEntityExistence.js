//to check if entity exits and is linked

const { DataError } = require("../../error");
const checkallExistence = require("./checkallExistence");
const checkoneExistence = require("./checkoneExistence");

const validateEntityExistence = async (
  table,
  column,
  id,
  checkExistenceParams,
  errorMessage,
  sec_table,
  opt
) => {
  const entityExists = await checkoneExistence(table, column, id);
  if (!entityExists) {
    throw new DataError(
      `${table} information is not available or invalid. Please verify the ${table} details and try again.`
    );
  }

  const isLinked = await checkallExistence(
    sec_table,
    checkExistenceParams,
    opt
  );
  if (isLinked) {
    throw new DataError(errorMessage);
  }
};

module.exports = validateEntityExistence;
