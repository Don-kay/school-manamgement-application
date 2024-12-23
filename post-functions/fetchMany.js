const { connection } = require("../config/connection");
const { BadRequestError } = require("../error");

const FetchMany = async (table, tableargId, insertId) => {
  let query = `SELECT * FROM ${table} WHERE ${tableargId} = ?`;
  const values = [insertId];
  // console.log(table);
  // Execute the query
  const fetchData = await connection.query(query, values, (err, result) => {
    if (err) {
      throw new BadRequestError("could not access resource", err);
    } else {
      return `Rows affected: ${result}`;
    }
  });
  return fetchData;
};

module.exports = FetchMany;
