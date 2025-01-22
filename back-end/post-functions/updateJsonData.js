const { StatusCodes } = require("http-status-codes");
const FetchSingleData = require("./fetchSingleInputedData");
const { BadRequestError } = require("../error");

const updateJsonData = async (table, updates, rowId, insertId, pool) => {
  try {
    const calculateQuery = `UPDATE scores
SET score = (
  SELECT SUM(
    CAST(JSON_EXTRACT(assessment, CONCAT('$.', jt.json_key)) AS UNSIGNED)
  )
  FROM JSON_TABLE(
    JSON_KEYS(assessment),
    "$[*]" COLUMNS (json_key VARCHAR(50) PATH "$")
  ) AS jt
) WHERE score_id = '${insertId}'
`;

    let query = `UPDATE ${table} SET `;
    const values = [];

    // Iterate through the updates to construct the query
    Object.entries(updates).forEach(([key, value]) => {
      if (typeof value === "object" && !Array.isArray(value)) {
        // Handle JSON_OBJECT for object values
        // const jsonEntries = Object.entries(value)
        //   .map(([jsonKey, jsonValue]) => `${jsonKey}', '${jsonValue}`)
        //   .join(", ");
        const jsonEntries = Object.entries(value)
          .flatMap(([jsonKey, jsonValue]) => [`$.${jsonKey}`, jsonValue])
          .map((val) => `'${val}'`)
          .join(", ");

        query += `${key} = JSON_SET(${key}, ${jsonEntries} ), `;
      } else {
        // Regular key-value updates
        query += `${key} = ?, `;
        values.push(value);
      }
    });

    // Remove the trailing comma and space
    query = query.slice(0, -2);

    // Append the WHERE clause
    query += ` WHERE ${rowId} = ?`;
    values.push(insertId);

    //Execute the query
    const [result] = await pool.query(query, values);

    // Check if any rows were affected
    if (result.changedRows > 0) {
      const [updateScore] = await pool.query(calculateQuery);
      if (updateScore.affectedRows > 0) {
        const fetchData = await FetchSingleData(table, rowId, insertId, pool);
        // Check if data was fetched successfully
        if (
          !fetchData ||
          Object.keys(fetchData).length === 0 ||
          fetchData.msg?.match(/[a-zA-Z]/)
        ) {
          throw new BadRequestError("unable to fetch data");
        }
        return fetchData;
      }
    } else {
      throw new BadRequestError("no change made");
    }
  } catch (error) {
    throw error;
  }
};

module.exports = updateJsonData;
