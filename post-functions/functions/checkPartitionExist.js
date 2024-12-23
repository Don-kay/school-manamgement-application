const { connection } = require("../../config/connection");

const CheckPartitionExist = async (table, partitionName) => {
  return await new Promise((resolve, reject) => {
    let query = `SELECT PARTITION_NAME FROM INFORMATION_SCHEMA.PARTITIONS WHERE TABLE_NAME = ? PARTITION_NAME = ?;`;

    const create = connection.query(
      query,
      [table, partitionName],
      (err, result) => {
        if (err) {
          throw reject(false);
        } else {
          console.log(result);
          return resolve(true);
        }
      }
    );
    console.log(create);
  });
};

module.exports = CheckPartitionExist;
