const updateTableColumns = async (table, column1, password, transaction) => {
  try {
    // Fetch all table names with the specified columns
    const [tables] = await transaction.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.COLUMNS
        WHERE COLUMN_NAME = ? AND TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?`,
      [column1, table]
    );

    // console.log(tables);
    // console.log(password);
    // console.log(updateData2);
    // console.log(updateData1);
    // Iterate over each table and update records
    for (let { TABLE_NAME: tableName } of tables) {
      const updateQuery = `UPDATE ${tableName} SET ${column1} = ?`;

      const queryParams = [password.password];

      await transaction.query(updateQuery, queryParams);
    }
  } catch (error) {
    await transaction.rollback(); // Rollback in case of any error
    throw error; // Re-throw the error after rollback
  }
};

module.exports = updateTableColumns;
