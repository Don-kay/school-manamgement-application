const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { NotFoundError, UnauthorizedError } = require("../error");
const deleteData = require("../post-functions/deleteData");
const updateData = require("../post-functions/updateData");

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

async function comparePassword(pwd, hashPwd) {
  // console.log(await bcrypt.compare(pwd, hashPwd));
  return await bcrypt.compare(pwd, hashPwd);
}
function createJwt(staff_id, firstname, email, role_id, branch_id, session_id) {
  return jwt.sign(
    { staff_id, firstname, email, role_id, branch_id, session_id },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );
}
async function hqLogoutJwt(
  staff_id,
  // firstname,
  // email,
  // role_id,
  // branch_id,
  token_version,
  hqPool,
  branchPool,
  hqid,
  staffBranchid
) {
  let branchLogout;
  const hqLogout = await updateData(
    "staff",
    { token_version: token_version + 1 },
    "token_version",
    staff_id,
    hqPool
  );

  console.log(hqLogout);
  // if (hqid !== staffBranchid) {
  //   branchLogout = await updateData(
  //   "staff",
  //   { token_version: token_version + 1 },
  //   "token_version",
  //   staff_id,
  //   branchPool)
  //   }

  // const sql = `UPDATE users SET token_version = token_version + 1 WHERE id = ?`;
  // await pool.execute(sql, [staffId]);

  // return jwt.sign(
  //   { staff_id, firstname, email, role_id, branch_id, token_version },
  //   process.env.JWT_SECRET,
  //   { expiresIn: process.env.JWT_LOGOUT }
  // );
}
async function logoutJwt(staff_id, branchPool) {
  try {
    const [session] = await branchPool.query(
      "SELECT * FROM cookie_sessions WHERE staff_id = ?",
      [staff_id]
    );

    if (session?.length !== 0) {
      const deleteSession = await deleteData(
        "cookie_sessions",
        "staff_id",
        staff_id,
        branchPool
      );

      return {
        deleteSession,
      };
    } else {
      return `Staff with id: ${staff_id} is not logged-in`;
    }
  } catch (error) {
    throw error;
  }
}

module.exports = {
  hashPassword,
  comparePassword,
  createJwt,
  logoutJwt,
  hqLogoutJwt,
};
