const { getBranchPool, masterPool } = require("../../config/connection");
const checkallDBExistence = require("../branchDB/checkallDBExistence");
const CreateData = require("../createData");
const updateData = require("../updateData");
const {
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
} = require("./dbTransactionHelper");

/**
 * Assign staff to a branch
 */
async function CopySession(sessionId, hqId) {
  const hqPool = await getBranchPool(hqId); // Assume HQ branch pool is fetched by ID
  // const branchPool = await getBranchPool(branchId);

  let hqConnection, mainDBConnection;

  try {
    // Start transactions
    // hqConnection = await beginTransaction(hqPool);
    hqConnection = await beginTransaction(hqPool);
    mainDBConnection = await beginTransaction(masterPool);

    const mainDB = mainDBConnection.connection.config.database;
    const hqDB = hqConnection.connection.config.database;

    // Fetch staff details from HQ
    const [sessionRows] = await hqConnection.query(
      "SELECT * FROM academic_session WHERE session_id = ?",
      [sessionId]
    );
    if (sessionRows.length === 0) {
      throw new Error(`Session with ID ${sessionId} not found in ${hqDB}`);
    }

    //Insert staff into branch database
    const copyData = await CreateData(
      "academic_session",
      sessionRows[0],
      "session_id",
      sessionId,
      mainDBConnection
    );

    // Commit both transactions
    await commitTransaction(hqConnection);
    await commitTransaction(mainDBConnection);

    return {
      msg: `Session ${sessionId} has been successfully copied from ${hqDB} to ${mainDB}`,
      data: copyData,
    };
  } catch (error) {
    // Rollback both transactions
    if (hqConnection) await rollbackTransaction(hqConnection);
    if (mainDBConnection) await rollbackTransaction(mainDBConnection);

    throw error;
  }
}

module.exports = { CopySession };
