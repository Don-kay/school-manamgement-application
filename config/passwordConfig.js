const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

async function comparePassword(pwd, hashPwd) {
  console.log(await bcrypt.compare(pwd, hashPwd));
  return await bcrypt.compare(pwd, hashPwd);
}
function createJwt(staff_id, firstname, email, role_id, branch_id) {
  return jwt.sign(
    { staff_id, firstname, email, role_id, branch_id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_LIFETIME }
  );
}
function logoutJwt(staff_id, firstname, email, role_id, branch_id) {
  return jwt.sign(
    { staff_id, firstname, email, role_id, branch_id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_LOGOUT }
  );
}

module.exports = { hashPassword, comparePassword, createJwt, logoutJwt };
