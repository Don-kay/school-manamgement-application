const { connection } = require("../config/connection");
const { StatusCodes } = require("http-status-codes");

const fetchPPlinked = async (
  table,
  table2,
  tableId,
  table2argId,
  insertId,
  pool
) => {
  let query = `SELECT ${table}.* FROM ${table} JOIN ${table2} ON ${table}.${tableId} = ${table2}.${tableId} WHERE ${table2}.${table2argId} = ?`;
  const values = [insertId];
  // Execute the query
  const fetchData = await pool.query(query, values, (err, result) => {
    if (err) {
      return { err };
    } else {
      return `Rows affected: ${result}`;
    }
  });
  return fetchData;
};

module.exports = fetchPPlinked;
