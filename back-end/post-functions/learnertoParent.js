const { connection } = require("../config/connection");
const FetchSingleData = require("../post-functions/fetchSingleInputedData");
const { StatusCodes } = require("http-status-codes");
const { BadRequestError, DataError } = require("../error");
const FetchMany = require("./fetchMany");

async function LinkLearnerData(table, data, pool) {
  const { parent_id, learner_id } = data;

  const insertId = [parent_id, learner_id];
  let query = `INSERT INTO ${table} (`;

  const values = [];

  //   console.log(parent_id);

  for (let [key, value] of Object.entries(data)) {
    query += `${key}, `;
    values.push(value);
  }

  // Remove trailing comma and space
  query = query.slice(0, -2) + ") VALUES (";

  query += values.map(() => "?").join(", ") + ")";

  try {
    const [parentkids] = await FetchMany(
      "montessori_learners",
      "parent_id",
      parent_id,
      pool
    );
    if (!parentkids) {
      throw new DataError("couldn't access resource");
    }
    const numberOfKids = parentkids.length === 0 ? 0 : parentkids.length;

    let incrementquery = `UPDATE parents SET registered_kids = ? WHERE parent_id = ?`;

    // Execute the query
    const LinkLearner = await pool.query(query, values, (err, result) => {
      if (err) {
        throw err;
      } else {
        return `Rows affected: ${result}`;
      }
    });

    if (LinkLearner[0].affectedRows > 0) {
      const [addChildtoParent] = await pool.query(
        incrementquery,
        [numberOfKids, parent_id],
        (err, result) => {
          if (err) {
            throw err;
          } else {
            return `Rows affected: ${result}`;
          }
        }
      );

      const fetchData = await FetchSingleData(
        table,
        "parent_id",
        insertId,
        pool,
        "learner_id",
        "AND"
      );

      if (addChildtoParent.affectedRows <= 0) {
        throw new DataError("unable to update parent data");
      }
      if (
        !fetchData ||
        Object.keys(fetchData).length === 0 ||
        fetchData.msg?.match(/[a-zA-Z]/)
      ) {
        throw new DataError("unable to fetch data");
      }

      return {
        msg: "successfully linked to parent",
        fetchData,
      };
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

module.exports = LinkLearnerData;
