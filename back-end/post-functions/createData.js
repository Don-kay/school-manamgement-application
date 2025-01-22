const { connection } = require("../config/connection");
const { StatusCodes } = require("http-status-codes");
const FetchSingleData = require("./fetchSingleInputedData");
const { DataError } = require("../error");

const CreateData = async (
  table,
  updates,
  rowId1,
  insertId,
  pool,
  rowId2,
  opt
) => {
  let query = `INSERT INTO ${table} (`;
  const values = [];

  for (let [key, value] of Object.entries(updates)) {
    query += `${key}, `;
    values.push(value);
  }

  // Remove trailing comma and space
  query = query.slice(0, -2) + ") VALUES (";

  query += values.map(() => "?").join(", ") + ")";

  // console.log(values);
  //console.log(pool);
  // Execute the query
  try {
    const [create] = await pool.query(query, values);

    if (create.affectedRows > 0) {
      const fetchData = await FetchSingleData(
        table,
        rowId1,
        insertId,
        pool,
        rowId2,
        opt
      );
      if (
        !fetchData ||
        Object.keys(fetchData).length === 0 ||
        fetchData.msg?.match(/[a-zA-Z]/)
      ) {
        throw new DataError(
          "unable to fetch information, id invalid. Please check the details and try again."
        );
      }
      return fetchData;
    } else {
      throw new DataError("unable to create data. Please try again.");
      // return { msg: "failed to create" };
    }
  } catch (error) {
    throw error;
  }
};

module.exports = CreateData;
