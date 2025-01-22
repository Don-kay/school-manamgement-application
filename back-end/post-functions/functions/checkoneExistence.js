const { StatusCodes } = require("http-status-codes");

async function checkoneExistence(table, tableId, data, pool) {
  try {
    const [rows] = await pool.query(
      `SELECT ${tableId} FROM ${table} WHERE ${tableId} = ? LIMIT 1`,
      [data]
    );

    if (rows?.length === 0) {
      return false;
    } else {
      return true;
    }
  } catch (error) {
    throw ("ERROR:", error);
  }
}

module.exports = checkoneExistence;
