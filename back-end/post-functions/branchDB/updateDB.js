const { masterPool } = require("../../config/connection");
const { StatusCodes } = require("http-status-codes");
const FetchSingleMainDB = require("./fetchSinglemainDB");
const { BadRequestError } = require("../../error");

const updateDB = async (table, updates, rowId, insertId) => {
  try {
    // Build the query
    let query = `UPDATE ${table} SET `;
    const values = [];

    Object.entries(updates).forEach(([key, value]) => {
      query += `${key} = ?, `;
      values.push(value);
    });

    // Remove the trailing comma and space
    query = query.slice(0, -2);
    query += ` WHERE ${rowId} = ?`;
    values.push(insertId);

    // Execute the query
    const [result] = await masterPool.query(query, values);
    // Check if any rows were affected
    if (result.changedRows > 0) {
      const fetchData = await FetchSingleMainDB(table, rowId, insertId);

      // Check if data was fetched successfully
      if (
        !fetchData ||
        Object.keys(fetchData).length === 0 ||
        fetchData.msg?.match(/[a-zA-Z]/)
      ) {
        throw new BadRequestError("unable to fetch data");
      }

      return fetchData;
    } else {
      throw new BadRequestError("no change made");
    }
  } catch (error) {
    throw error;
  }
};

module.exports = updateDB;
