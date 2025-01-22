const uuId = require("./uniqueId");
const { v4: uuidv4 } = require("uuid");

async function GenerateStaffCode(table, tableId, pool) {
  try {
    let idExists = true;
    let generatedId;
    const maxAttempt = 10;
    let attempts = 0;

    while (idExists && attempts < maxAttempt) {
      attempts += 1;
      const uuid = uuidv4().replace(/-/g, "");
      generatedId = (parseInt(uuid.slice(0, 7), 16) % 9000000) + 1000000;
      // generatedId = `f7662227-7812-450c-ae9c-6cd783ac88d1-260098160376000-160676578364+${code}`;

      const [rows] = await pool.query(
        `SELECT COUNT(*) as count FROM ${table} WHERE ${tableId} = ?`,
        [generatedId]
      );
      // console.log(rows);
      if (rows[0].count === 0) {
        idExists = false;
        attempts = 12;
      }
    }
    return idExists
      ? "failed to generate unique id after 10 attempts"
      : generatedId;
  } catch (error) {
    return "ERROR:", error;
  }
}

module.exports = GenerateStaffCode;
