const updateAllChildren = async (
  table,
  column1,
  column2,
  updateData1,
  updateData2,
  insertId,
  transaction
) => {
  try {
    // Fetch all table names with the specified columns
    const [tables] = await transaction.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.COLUMNS
        WHERE COLUMN_NAME = ? AND TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME != ?
        AND TABLE_NAME IN (
          SELECT TABLE_NAME 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE COLUMN_NAME = ? AND TABLE_NAME != ?
        );`,
      [column1, table, column1, "invoices"]
    );

    // console.log(tables);
    // console.log(insertId);
    // console.log(updateData2);
    // console.log(updateData1);
    // Iterate over each table and update records
    for (let { TABLE_NAME: tableName } of tables) {
      const updateQuery = insertId
        ? `UPDATE ${tableName} SET ${column1} = ?, ${column2} = ?`
        : `UPDATE ${tableName} SET ${column1} = ?, ${column2} = ? WHERE ${column2} = ?`;

      const queryParams = insertId
        ? [updateData1, updateData2]
        : [updateData1, updateData2, insertId];

      await transaction.query(updateQuery, queryParams);
    }
  } catch (error) {
    throw error; // Re-throw the error after rollback
  }
};

module.exports = updateAllChildren;
