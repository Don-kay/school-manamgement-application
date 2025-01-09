const { connection } = require("../config/connection");
const { StatusCodes } = require("http-status-codes");
const FetchSingleData = require("./fetchSingleInputedData");
const { DataError } = require("../error");

const CreateJsonData = async (
  table,
  updates,
  rowId1,
  insertId,
  pool,
  rowId2,
  opt
) => {
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

  let query = `INSERT INTO ${table} (`;
  const values = []; // Holds the non-JSON values
  let jsonFields = {}; // Holds fields for JSON_OBJECT

  for (let [key, value] of Object.entries(updates)) {
    if (typeof value === "object" && !Array.isArray(value)) {
      // Handle JSON object fields
      jsonFields[key] = value; // Save the field for JSON_OBJECT processing
    } else {
      query += `${key}, `;
      values.push(value); // Add to values array for placeholders
    }
  }

  // Remove trailing comma and space for the columns
  query = query.slice(0, -2) + ") VALUES (";

  // Add placeholders for regular values
  query += values.map(() => "?").join(", ");

  // Add JSON_OBJECT handling
  if (Object.keys(jsonFields).length > 0) {
    for (let [jsonKey, jsonValue] of Object.entries(jsonFields)) {
      query = query.replace(") VALUES (", `, ${jsonKey}) VALUES (`);
      // Append the JSON_OBJECT as part of the query
      const jsonEntries = Object.entries(jsonValue)
        .map(
          ([jsonField, jsonFieldValue]) => `'${jsonField}', '${jsonFieldValue}'`
        )
        .join(", ");

      query += `, JSON_OBJECT(${jsonEntries})`;
    }
  }

  // Finalize the query
  query += ")";

  try {
    const [create] = await pool.query(query, values);

    if (create.affectedRows > 0) {
      const [updateScore] = await pool.query(calculateQuery);
      if (updateScore.affectedRows > 0) {
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
      }
    } else {
      throw new DataError("unable to create data. Please try again.");
      // return { msg: "failed to create" };
    }
  } catch (error) {
    throw error;
  }
};

module.exports = CreateJsonData;
