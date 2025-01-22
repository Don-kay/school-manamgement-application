const { connection } = require("../config/connection");
const CheckPartitionExist = require("./functions/checkPartitionExist");
const { DataError } = require("../error");

const CreatePartition = async (table, name, branchId) => {
  return await new Promise((resolve, reject) => {
    const branchName = `Branch:${name}`;
    if (CheckPartitionExist(table, branchName)) {
      throw new DataError(
        "Duplicate entry ::) partition exist, try another value"
      );
    }
    let query = `ALTER TABLE ${table} ADD PARTITION (PARTITION ${branchName} VALUES IN (${branchId}))`;

    const create = connection.query(query, (err, result) => {
      if (err) {
        throw reject(err);
      } else {
        console.log(result);
        return resolve(`Rows affected: ${result}`);
      }
    });
    console.log(create);
  });
};

module.exports = CreatePartition;
