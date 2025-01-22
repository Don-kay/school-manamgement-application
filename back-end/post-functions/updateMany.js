const { connection } = require("../config/connection");
const { StatusCodes } = require("http-status-codes");
const { Success, DataError } = require("../error");

const UpdateMany = async (table, ids, affectedColumn, rowId, pool) => {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error("Invalid or empty IDs array");
  }

  // Construct the SET part of the query
  const setClauses = Object.entries(affectedColumn)
    .map(([key]) => `${key} = ?`)
    .join(", ");

  // Prepare placeholders for the WHERE clause
  const placeholders = ids.map(() => "?").join(", ");

  // Construct the full query
  const query = `
    UPDATE ${table}
    SET ${setClauses}
    WHERE ${rowId} IN (${placeholders})
  `;

  // Prepare the values for the query
  const values = [...Object.values(affectedColumn), ...ids];

  try {
    const [result] = await pool.query(query, values);

    if (result.affectedRows === ids.length) {
      return "Updated successfully";
    } else {
      throw new DataError("Some records were not updated");
    }
  } catch (error) {
    throw error;
  }
};

module.exports = UpdateMany;

// const mysql = require("mysql2");

// // Create a MySQL connection
// const connection = mysql.createConnection({
//   host: "localhost",
//   user: "your_username",
//   password: "your_password",
//   database: "your_database",
// });

// connection.connect();

// // Array of users to update
// const usersToUpdate = [
//   { id: 1, ward: "John", age: 28 },
//   { id: 2, ward: "John", age: 25 },
//   { id: 3, ward: "John", age: 30 },
// ];

// const newWard = "Mike";

// // Function to update a single user
// function updateUser(user) {
//   try {
//     const query = `UPDATE users SET ward = ? WHERE id = ?`;
//     const values = [newWard, user.id];

//     connection.query(query, values, (error, results) => {
//       if (error) {
//         console.error(`Error updating user with ID ${user.id}:`, error);
//       } else {
//         console.log(`User with ID ${user.id} updated successfully.`);
//       }
//     });
//   } catch (error) {
//     console.error("Unexpected error:", error);
//   }
// }

// // Update all users
// usersToUpdate.map((user) => updateUser(user));

// // Close the connection after updates (in a real application, ensure all updates are complete before closing)
// setTimeout(() => {
//   connection.end();
// }, 1000);
