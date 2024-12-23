const { connection } = require("../../config/connection");
const { NotFoundError } = require("../../error");

async function GenerateCode(table, tableId, code) {
  const [[result]] = await connection.query(
    `SELECT MAX(CAST(SUBSTRING_INDEX(${tableId}, '/', -1) AS UNSIGNED)) AS maxNumber
   FROM ${table}
   WHERE ${tableId} LIKE ?`,
    [`${code}%`]
  );
  // console.log(result);
  if (result === undefined || result.maxNumber === 0)
    throw new NotFoundError("no admitted learner for the session");
  const maxNumber = result.maxNumber || 0;
  const newNumber = maxNumber + 1;
  const newId = `${code}${String(newNumber).padStart(3, "0")}`;

  return newId;

  // Use the newId as needed
}

module.exports = GenerateCode;
