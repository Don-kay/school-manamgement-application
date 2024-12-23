const { connection } = require("../config/connection");
const FetchSingleData = require("../post-functions/fetchSingleInputedData");
const { StatusCodes } = require("http-status-codes");
const { BadRequestError, DataError } = require("../error");
const FetchMany = require("./fetchMany");

async function UpdateLearnerData(table, data, insertId, opt) {
  const { parent_id, learner_id } = insertId;
  let query = `UPDATE ${table} SET `;

  const values = [];

  Object.entries(data).forEach(([key, value]) => {
    query += `${key} = ?, `;
    values.push(value);
  });

  // Remove the trailing comma and space
  query = query.slice(0, -2);
  query += ` WHERE parent_id = ? AND learner_id = ?`;
  values.push(parent_id, learner_id);

  // console.log(query);
  // console.log(values);

  try {
    // Execute the query
    await connection.query(query, values, (err, result) => {
      if (err) {
        throw err;
      } else {
        return `Rows affected: ${result}`;
      }
    });
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

module.exports = UpdateLearnerData;
