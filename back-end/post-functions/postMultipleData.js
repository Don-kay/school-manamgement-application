const { BadRequestError } = require("../error");

async function InsertMultipleData(tableName, data, pool) {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Data must be a non-empty array.");
  }

  // Extract column names from the first object
  const columns = Object.keys(data[0]);
  const placeholders = `(${columns.map(() => "?").join(", ")})`;

  // Generate bulk insert values
  const values = data.flatMap(Object.values);

  const query = `
        INSERT INTO ?? (${columns.map((col) => `\`${col}\``).join(", ")})
        VALUES ${data.map(() => placeholders).join(", ")}
    `;
  // const connection = await dbPool.getConnection();
  try {
    const [result] = await pool.query(query, [tableName, ...values]);
    if (result.affectedRows !== data?.length) {
      throw new BadRequestError("process failed, unable to post all data");
    }
    return `${result.affectedRows} data successfully synced to branch`;
  } catch (error) {
    console.error("Error inserting data:", error.message);
    throw error;
  }
}

module.exports = { InsertMultipleData };
// Usage example
//   async () => {
//     const dbPool = mysql.createPool({
//       host: "localhost",
//       user: "root",
//       password: "password",
//       database: "school",
//     });

//     const data = [
//       {
//         subject_id:
//           "db55762c-8232-45c0-8664-e4ccf851a587-35129039677400-790125027915+SUBJECT",
//         subject: "Music",
//         created_At: "2025-01-04T16:08:45.000Z",
//         updated_At: "2025-01-04T16:21:16.000Z",
//         year: 2024,
//         session_id:
//           "77b8ec09-c2b9-46e0-9a07-a8d1c74da4cd-97882534953300-238960782586+SESSION",
//       },
//       {
//         subject_id:
//           "e00d20e0-9fc6-4b8c-91d7-1958899a2e99-35159085233800-174175490497+SUBJECT",
//         subject: "Numeracy",
//         created_At: "2025-01-04T16:09:15.000Z",
//         updated_At: "2025-01-04T16:09:15.000Z",
//         year: 2024,
//         session_id:
//           "77b8ec09-c2b9-46e0-9a07-a8d1c74da4cd-97882534953300-238960782586+SESSION",
//       },
//     ];

//     const tableName = "subjects";

//     try {
//       const result = await insertDataToTable(data, tableName, dbPool);
//       console.log("Insert Result:", result);
//     } catch (error) {
//       console.error("Error:", error.message);
//     } finally {
//       await dbPool.end();
//     }
//   }
// )();
