const { storeBranchPool } = require("../config/connection");
const { StatusCodes } = require("http-status-codes");
const { NotFoundError } = require("../error");

async function fetchallExistence(table, parameter, pool) {
  let query = `SELECT * FROM ${table} WHERE `;
  const values = [];
  for (let [key, value] of Object.entries(parameter)) {
    query += `${key} = ? AND `;
    values.push(value);
  }
  // Remove trailing comma and space
  query = query.slice(0, -4);

  try {
    const [rows] = await pool.query(query, values);

    if (rows?.length === 0) {
      return false;
    } else {
      return rows;
    }
  } catch (error) {
    throw error;
  }
}

module.exports = fetchallExistence;
