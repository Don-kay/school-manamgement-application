const { masterPool } = require("../../config/connection");
const { StatusCodes } = require("http-status-codes");

async function checkoneDB(table, tableId, data) {
  try {
    const [rows] = await masterPool.query(
      `SELECT ${tableId} FROM ${table} WHERE ${tableId} = ? LIMIT 1`,
      [data]
    );

    if (rows?.length === 0) {
      return false;
    } else {
      return true;
    }
  } catch (error) {
    return "ERROR:", error;
  }
}

module.exports = checkoneDB;
