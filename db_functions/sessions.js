const UpdateData = require("../post-functions/updateData");
const updateAllChildren = require("../post-functions/updateAllChildren");
const CreateData = require("../post-functions/createData");
const { DataError } = require("../error");
const { CopySession } = require("../post-functions/functions/copySession");

const Sessions = {
  copy: async (sessionid, hqid) => {
    const copy = await CopySession(sessionid, hqid);

    return copy;
  },
};

module.exports = Sessions;
