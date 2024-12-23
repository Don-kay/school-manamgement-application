const { connection } = require("../config/connection");
const { StatusCodes } = require("http-status-codes");
const updateWard = require("../post-functions/updateData");

const DeLinkLearner = async (table, data, insertId) => {
  const ward = { ward: null, parent_id: null };

  // Build the WHERE clause dynamically using Object.entries
  const conditions = Object.entries(data)
    .map(([key, value]) => `${key} = ?`)
    .join(" AND ");

  const values = Object.values(data);
  const [result] = await connection.query(
    `DELETE FROM ${table} WHERE ${conditions}`,
    values
  );
  try {
    if (result.affectedRows > 0) {
      const deleteWard = await updateWard(
        "montessori_learners",
        ward,
        "learner_id",
        insertId
      );
      return {
        msg: "Learner successfully de-linked from parent",
        deleteWard,
      };
    } else {
      return {
        msg: "failed to de-link Learner from parent ::) no linked parent and learner",
      };
    }
  } catch (error) {
    return { message: "Error de-linking pupil from parent", error };
  }
};

module.exports = DeLinkLearner;
