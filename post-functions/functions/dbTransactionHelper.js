async function beginTransaction(pool) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  return connection;
}

/**
 * Commit and release a transaction
 */
async function commitTransaction(connection) {
  await connection.commit();
  connection.release();
}

/**
 * Rollback and release a transaction
 */
async function rollbackTransaction(connection) {
  await connection.rollback();
  connection.release();
}

module.exports = { beginTransaction, commitTransaction, rollbackTransaction };
