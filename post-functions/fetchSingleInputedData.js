const masterPool = require("../config/connection");
const { StatusCodes } = require("http-status-codes");
const { NotFoundError } = require("../error");

async function FetchSingleData(table, tableId, insertId, tableId2, opt) {
  const query = !opt
    ? `SELECT * FROM ${table} WHERE ${tableId} = ?`
    : `SELECT * FROM ${table} WHERE ${tableId} = ? ${opt} ${tableId2} = ?`;
  const values = !opt ? [insertId] : insertId;
  const getInputedData = await masterPool.query(query, values);
  if (Array.isArray(getInputedData) && getInputedData[0].length > 0) {
    const dataArray = getInputedData[0];
    const data = dataArray[0];

    return data;
  } else {
    throw new NotFoundError("invalid entry, please verify and try again");
  }
}

module.exports = FetchSingleData;
