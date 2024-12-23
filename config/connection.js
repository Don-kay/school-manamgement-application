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

const branchPools = new Map();

async function getBranchPool(branchId) {
  if (branchPools.has(branchId)) {
    return branchPools.get(branchId);
  }

  //fetch branch db details from central database

  const [rows] = await masterPool.query(
    "SELECT * FROM branch_connections WHERE branch_id = ?",
    [branchId]
  );
  if (rows.length === 0) {
    console.log("INVALID ID");
  }
  console.log(rows[0]);
}
// async function storeBranchPool() {
//   // if (branchPools.has(branchId)) {
//   //   return branchPools.get(branchId);
//   // }

//   //fetch branch db details from central database

//   console.log(branchPools);
//   console.log(branchPools);

//   const createBranchDB = await masterPool.query(
//     "INSERT FROM branch_connections WHERE branch_id = ?",
//     [branchId]
//   );
//   if (rows.length === 0) {
//     console.log("INVALID ID");
//   }
//   // console.log(rows[0]);
// }

module.exports = { getBranchPool, masterPool };

// class DatabaseManager {
//   constructor() {
//     this.branchConfig = {
//       branch_main: {
//         host: process.env.DB_HOST,
//         user: process.env.DB_USER,
//         password: process.env.DB_PASSWORD,
//         port: process.env.DB_PORT || 3306,
//         database: process.env.DB_MAIN,
//       },
//       branch_1: {
//         host: process.env.DB_HOST,
//         user: process.env.DB_USER,
//         password: process.env.DB_PASSWORD,
//         port: process.env.DB_PORT || 3306,
//         database: process.env.DB_1,
//       },
//       branch_2: {
//         host: process.env.DB_HOST,
//         user: process.env.DB_USER,
//         password: process.env.DB_PASSWORD,
//         port: process.env.DB_PORT || 3306,
//         database: process.env.DB_2,
//       },
//     };
//     this.poolMap = new Map();
//   }

//   async getConnectionPool(branchId) {
//     if (!this.branchConfig[branchId])
//       throw new BadRequestError("Invalid Branch ID");

//     if (!this.poolMap.has(branchId)) {
//       const pool = mysql.createPool({
//         ...this.branchConfig[branchId],
//         waitForConnections: true,
//         connectionLimit: 10,
//         queueLimit: 0,
//       });
//       this.poolMap.set(branchId, pool);
//     }
//     return this.poolMap.get(branchId);
//   }

//   async query(branchId, sql, params = []) {
//     const pool = await this.getConnectionPool(branchId);
//     return pool.execute(sql, params);
//   }

//   closeAll() {
//     this.poolMap.forEach((pool) => pool.end());
//     this.poolMap.clear();
//   }

//   async checkConnection(branchId) {
//     try {
//       const pool = await this.getConnectionPool(branchId);
//       const [connection] = await pool.query("SELECT 1");
//       console.log(`Connected to the database for branch: ${branchId}`);
//       return connection;
//     } catch (error) {
//       console.error("Error connecting to the database:", error.message);
//       throw error;
//     }
//   }
// }

// module.exports = new DatabaseManager();
