const { connection } = require("../config/connection");
const { DataError, BadRequestError } = require("../error");

const deleteData = async (table, rowId1, insertId, rowId2, opt) => {
  let query = !opt
    ? `DELETE FROM ${table} WHERE ${rowId1} = ?`
    : `DELETE FROM ${table} WHERE ${rowId1} = ? ${opt} ${rowId2} = ?`;
  const values = !opt ? [insertId] : insertId;

  try {
    const deleteData = await connection.query(query, values, (err, result) => {
      if (err) {
        throw err;
      } else {
        return `Rows affected: ${result}`;
      }
    });

    if (deleteData[0].affectedRows > 0) {
      return !opt
        ? `successfully deleted heirachy with ${rowId1}: ${insertId[0]}`
        : `successfully unlinked ${rowId1}: ${insertId[0]} from ${rowId2}: ${insertId[1]}`;
    } else {
      throw new BadRequestError("failed to delete");
    }
  } catch (error) {
    throw error;
  }
};

module.exports = deleteData;