const { StatusCodes } = require("http-status-codes");
const FetchSingleData = require("./fetchSingleInputedData");
const { BadRequestError } = require("../error");

const updateData = async (
  table,
  updates,
  rowId,
  insertId,
  pool,
  rowId2,
  opt
) => {
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
    if (!opt) {
      query += ` WHERE ${rowId} = ?`;
      values.push(insertId);
    } else {
      query += ` WHERE ${rowId} = ? ${opt} ${rowId2} = ?`;
      values.push(...insertId);
    }

    // Execute the query
    const [result] = await pool.query(query, values);
    // Check if any rows were affected
    if (result.changedRows > 0) {
      const fetchData = await FetchSingleData(
        table,
        rowId,
        insertId,
        pool,
        rowId2,
        opt
      );
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

module.exports = updateData;
