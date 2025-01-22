const { connection } = require("../../config/connection");
const { StatusCodes } = require("http-status-codes");

async function checksingleExistence(table, tableId, data) {
  try {
    const [rows] = await connection.query(
      `SELECT ${tableId} FROM ${table} WHERE ${tableId} = ? LIMIT 1`,
      [data]
    );

    if (rows?.length === 0) {
      return {
        err: StatusCodes.NOT_FOUND,
      };
    } else {
      return data;
    }
  } catch (error) {
    return "ERROR:", error;
  }
}

module.exports = checksingleExistence;
