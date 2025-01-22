const { masterPool } = require("../../config/connection");
const { StatusCodes } = require("http-status-codes");

async function checkallDBExistence(table, parameter, opt) {
  let query = `SELECT * FROM ${table} WHERE `;
  const values = [];
  for (let [key, value] of Object.entries(parameter)) {
    query += `${key} = ? ${opt} `;
    values.push(value);
  }
  // Remove trailing comma and space
  query = query.slice(0, -4);
  // console.log(query);

  try {
    const [rows] = await masterPool.query(query, values);
    if (rows?.length === 0) {
      return false;
    } else {
      return true;
    }
  } catch (error) {
    return "ERROR:", error;
  }
}

module.exports = checkallDBExistence;
