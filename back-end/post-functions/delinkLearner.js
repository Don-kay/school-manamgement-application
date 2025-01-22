const { connection } = require("../config/connection");
const { StatusCodes } = require("http-status-codes");
const updateWard = require("../post-functions/updateData");
const { DataError, BadRequestError } = require("../error");
const FetchMany = require("./fetchMany");

const DeLinkLearner = async (table, data, insertId, branchPool) => {
  const { parent_id } = data;
  const ward = { ward: null, parent_id: null, surname: "no name" };

  // Build the WHERE clause dynamically using Object.entries
  const conditions = Object.entries(data)
    .map(([key, value]) => `${key} = ?`)
    .join(" AND ");

  const values = Object.values(data);

  try {
    const [result] = await branchPool.query(
      `DELETE FROM ${table} WHERE ${conditions}`,
      values
    );

    if (result.affectedRows > 0) {
      const unlinkWard = await updateWard(
        "montessori_learners",
        ward,
        "learner_id",
        insertId,
        branchPool
      );
      const [parentkids] = await FetchMany(
        "montessori_learners",
        "parent_id",
        parent_id,
        branchPool
      );
      if (!parentkids) {
        throw new DataError("couldn't access resource");
      }
      const numberOfKids = parentkids.length === 0 ? 0 : parentkids.length;

      let incrementquery = `UPDATE parents SET registered_kids = ? WHERE parent_id = ?`;

      const [addChildtoParent] = await branchPool.query(
        incrementquery,
        [numberOfKids, parent_id],
        (err, result) => {
          if (err) {
            throw err;
          } else {
            return `Rows affected: ${result}`;
          }
        }
      );

      if (addChildtoParent.affectedRows <= 0) {
        throw new DataError("unable to update parent data");
      }

      return {
        msg: "Learner successfully de-linked from parent",
        unlinkWard,
      };
    } else {
      throw new BadRequestError(
        "failed to de-link Learner from parent ::) no linked parent and learner"
      );
    }
  } catch (error) {
    throw error;
  }
};

module.exports = DeLinkLearner;
