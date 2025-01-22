const { getBranchPool, masterPool } = require("../../config/connection");
const checkallDBExistence = require("../branchDB/checkallDBExistence");
const CreateData = require("../createData");
const deleteData = require("../deleteData");
const updateData = require("../updateData");
const {
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
} = require("./dbTransactionHelper");

/**
 * Assign staff to a branch
 */
async function AssignStaffToBranch(staffId, branchId, hqId) {
  const hqPool = await getBranchPool(hqId); // Assume HQ branch pool is fetched by ID
  const branchPool = await getBranchPool(branchId);

  let hqConnection, branchConnection, prevBranchConnection, isNull;

  try {
    // Start transactions
    hqConnection = await beginTransaction(hqPool);
    branchConnection = await beginTransaction(branchPool);

    // Fetch staff details from HQ
    const [staffRows] = await hqConnection.query(
      "SELECT * FROM staff WHERE staff_id = ?",
      [staffId]
    );

    if (staffRows.length === 0) {
      throw new Error(`Staff with ID ${staffId} not found in HQ`);
    }
    const currentstaffBranchId = staffRows[0]?.branch_id;

    if (currentstaffBranchId !== null) {
      const prevBranchPool = await getBranchPool(currentstaffBranchId);
      prevBranchConnection = await beginTransaction(prevBranchPool);

      await deleteData("staff", "staff_id", staffId, prevBranchConnection);
    }

    isNull = false;

    const updatedData = await updateData(
      "staff",
      { branch_id: branchId },
      "staff_id",
      staffId,
      hqConnection
    );

    //Insert staff into branch database
    const copyData = await CreateData(
      "staff",
      updatedData,
      "staff_id",
      staffId,
      branchConnection
    );

    // Commit both transactions
    await commitTransaction(hqConnection);
    await commitTransaction(branchConnection);
    if (currentstaffBranchId !== null) {
      await commitTransaction(prevBranchConnection);
    }

    return {
      msg: `Staff ${staffId} successfully assigned to branch ${branchId}`,
      data: copyData,
    };
  } catch (error) {
    // Rollback both transactions
    if (hqConnection) await rollbackTransaction(hqConnection);
    if (branchConnection) await rollbackTransaction(branchConnection);
    if (isNull === false) {
      if (prevBranchConnection) await rollbackTransaction(prevBranchConnection);
    }

    throw error;
  }
}

module.exports = AssignStaffToBranch;
