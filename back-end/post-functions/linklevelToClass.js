const { connection } = require("../config/connection");
const update = require("./updateData");
const FetchSingleData = require("./fetchSingleInputedData");
const { StatusCodes } = require("http-status-codes");
const { BadRequestError, DataError } = require("../error");

async function linkLevelToClass(table, data, levelclass_id) {
  let query = `INSERT INTO ${table} (`;
  const values = [];

  for (let [key, value] of Object.entries(data)) {
    query += `${key}, `;
    values.push(value);
  }

  // Remove trailing comma and space
  query = query.slice(0, -2) + ") VALUES (";

  query += values.map(() => "?").join(", ") + ")";

  // Execute the query
  const LinkclassToLearner = await connection.query(
    query,
    values,
    (err, result) => {
      if (err) {
        throw err;
      } else {
        return `Rows affected: ${result}`;
      }
    }
  );

  try {
    if (LinkclassToLearner[0].affectedRows > 0) {
      const fetchData = await FetchSingleData(
        table,
        "levelclass_id",
        levelclass_id
      );
      if (
        !fetchData ||
        Object.keys(fetchData).length === 0 ||
        fetchData.msg?.match(/[a-zA-Z]/)
      ) {
        throw new DataError("unable to fetch data");
      }

      return { msg: "successfully linked yearlevel and classes", fetchData };
    } else {
      throw new BadRequestError("failed to link data");
    }
  } catch (error) {
    throw error;
  }

  // if (Array.isArray(getInputedData) && getInputedData.length > 0) {
  //   const dataArray = getInputedData[0];
  //   const data = dataArray[0];
  //   return data;
  // } else {
  //   throw new StatusCodes.NO_CONTENT(
  //     "content found, try again:) if error persist, user is invalid"
  //   );
  // }

  //console.log(getInputedData);
}

module.exports = linkLevelToClass;
