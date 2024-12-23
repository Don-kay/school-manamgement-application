const UpdateData = require("../post-functions/updateData");
const updateAllChildren = require("../post-functions/updateAllChildren");
const CreateData = require("../post-functions/createData");
const { DataError } = require("../error");

const Sessions = {
  create: async (session, id, isCurrent, currentSessionId, connection) => {
    // console.log(session);

    const data = await CreateData(
      "academic_session",
      session,
      "session_id",
      id
    );

    if (!data || Object.keys(data).length === 0) {
      connection.rollback();
      throw new DataError("failed to create, try again later");
    }

    if (isCurrent) {
      const { session_id, session } = data;
      await updateAllChildren(
        "academic_session",
        "year",
        "session_id",
        session,
        session_id,
        currentSessionId,
        connection
      );
    }

    return data;
  },
  update: async (sessionData, id, connection, currentSessionId) => {
    // Call the function to update a product
    const data = await UpdateData(
      "academic_session",
      sessionData,
      "session_id",
      id
    );

    if (!data || Object.keys(data).length === 0) {
      connection.rollback();
      throw new DataError("failed to update, try again later");
    }

    const { session_id, session } = data;
    await updateAllChildren(
      "academic_session",
      "year",
      "session_id",
      session,
      session_id,
      currentSessionId,
      connection
    );
    // console.log(data);
    return data;
  },
};

module.exports = Sessions;
