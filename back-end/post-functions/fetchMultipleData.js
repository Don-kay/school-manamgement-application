const { NotBeforeError } = require("jsonwebtoken");
const { NotFoundError } = require("../error");

async function FetchDataByIds(table, rowid, ids, pool) {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error("The provided IDs must be a non-empty array.");
  }

  try {
    const placeholders = ids.map(() => "?").join(",");

    // Generate the query to fetch data by multiple IDs
    const [rows] = await pool.query(
      `SELECT * FROM ${table} WHERE ${rowid} IN (${placeholders})`,
      ids
    );
    if (rows.length === 0) {
      throw new NotFoundError("data for input ids not found");
    }

    return rows;
  } catch (error) {
    throw error; // Rethrow to handle errors further up the chain
  } finally {
    pool.release();
  }
}

module.exports = { FetchDataByIds };

// Usage example
// (async () => {

//   const ids = [1, 2, 3, 4];

//   try {
//     const data = await fetchDataByIds(ids, dbPool);
//     console.log("Fetched Data:", data);
//   } catch (error) {
//     console.error("Error:", error.message);
//   } finally {
//     await dbPool.end();
//   }
// })();
