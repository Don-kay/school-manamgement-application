const mysql = require("mysql2/promise");
const { BadRequestError } = require("../error");
require("dotenv").config();

const masterPool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || "localhost:3306",
  database: process.env.CENTRAL_DB_NAME,
});

const branchPools = new Map(); //for caching branch pools
const poolTimeouts = new Map(); // Timeout references for pool closing
const IDLE_TIMEOUT = 3600000; // 1 hour

//Closes and removes a branch pool
async function closeBranchPool(branchId) {
  if (branchPools.has(branchId)) {
    try {
      await branchPools.get(branchId).end(); // Close pool
      console.log(`Branch pool ${branchId} closed`);
    } catch (error) {
      console.error(`Error closing branch pool ${branchId}:`, error.message);
    } finally {
      branchPools.delete(branchId); // Remove from cache
      poolTimeouts.delete(branchId); // Remove timeout reference
    }
  }
}

//  Resets the idle timeout for a branch pool

function resetIdleTimeout(branchId) {
  // Clear any existing timeout for this branch
  if (poolTimeouts.has(branchId)) {
    clearTimeout(poolTimeouts.get(branchId));
  }

  // Set a new timeout to close the pool
  const timeout = setTimeout(() => {
    closeBranchPool(branchId);
  }, IDLE_TIMEOUT);

  poolTimeouts.set(branchId, timeout);
}

/**
 * Closes all active pools (for graceful shutdown)
 */

async function getBranchPool(branchId) {
  if (branchPools.has(branchId)) {
    return branchPools.get(branchId);
  }

  //fetch branch db details from central database
  const [rows] = await masterPool.query(
    "SELECT * FROM branches WHERE branch_id = ?",
    [branchId]
  );

  if (rows.length === 0) {
    console.log(`INVALID ID: ${branchId}`);
  }
  const { branch_port, branch_host, branch_user, branch_password, db } =
    rows[0];

  //create and cache the new pool
  const branchPool = mysql.createPool({
    host: branch_host,
    user: branch_user,
    password: branch_password,
    port: branch_port,
    database: db,
  });

  branchPools.set(branchId, branchPool);

  resetIdleTimeout(branchId); //start idle timeout

  return branchPool;
}

module.exports = { getBranchPool, masterPool };
