const UpdateDB = require("../post-functions/branchDB/updateDB");
const updateAllChildren = require("../post-functions/updateAllChildren");
const CreateDB = require("../post-functions/branchDB/createmainDB");
const { DataError } = require("../error");
const CreateData = require("../post-functions/createData");
const {
  FilterAllowedFields,
} = require("../post-functions/functions/filterAllowedFields");
const updateData = require("../post-functions/updateData");
const AssignStaffToBranch = require("../post-functions/functions/assignStaffToBranch");

const MainDB = {
  storeDB: async (details, id, mainDBPool, hqPool) => {
    const data = await CreateData(
      "branches",
      details,
      "branch_id",
      id,
      mainDBPool
    );
    const {
      branch_host,
      branch_user,
      branch_password,
      branch_port,
      ...newData
    } = data;
    const copyData = await CreateData(
      "branch",
      newData,
      "branch_id",
      id,
      hqPool
    );

    return { msg: "branch successfully ceated and synced", copyData };
  },
  updateDb: async (details, id, mainDBPool, hqPool) => {
    // Call the function to update a product
    const data = await updateData(
      "branches",
      details,
      "branch_id",
      id,
      mainDBPool
    );
    const allowedFields = [
      "branch_id",
      "branch_name",
      "session_id",
      "year",
      "created_At",
      "updated_At",
      "db",
      "alias",
      "code",
      "hq",
    ];
    const filteredFields = FilterAllowedFields(data, allowedFields);
    const copyUpdate = await updateData(
      "branch",
      filteredFields,
      "branch_id",
      id,
      hqPool
    );
    return copyUpdate;
  },
  syncBranch: async (branch, id, pool) => {
    // Call the function to update a produc

    try {
      const allowedFields = [
        "branch_id",
        "branch_name",
        "address",
        "head_teacher",
        "region",
        "country",
        "state",
        "alias",
        "code",
        "session_id",
        "year",
        "created_At",
        "updated_At",
      ];
      const filteredFields = FilterAllowedFields(branch, allowedFields);

      const data = await CreateData(
        "branch",
        filteredFields,
        "branch_id",
        id,
        pool
      );
      return data;
    } catch (error) {
      throw error;
    }
  },
  createSession: async (
    sessionData,
    id,
    currentSessionId,
    mainDBPool,
    hqPool
  ) => {
    // console.log(session);

    const data = await CreateData(
      "academic_session",
      sessionData,
      "session_id",
      id,
      mainDBPool
    );

    if (!data || Object.keys(data).length === 0) {
      throw new DataError("failed to create, try again later");
    }

    const current = data?.current;
    const { session_id, session } = data;

    const syncData = await CreateData(
      "academic_session",
      data,
      "session_id",
      session_id,
      hqPool
    );

    if (current === "true") {
      await updateAllChildren(
        "academic_session",
        "year",
        "session_id",
        session,
        session_id,
        currentSessionId,
        hqPool
      );
    }

    return syncData;
  },
  updateSession: async (
    sessionData,
    id,
    currentSessionId,
    mainDBPool,
    hqPool
  ) => {
    // Call the function to update a product
    const data = await updateData(
      "academic_session",
      sessionData,
      "session_id",
      id,
      mainDBPool
    );

    if (!data || Object.keys(data).length === 0) {
      connection.rollback();
      throw new DataError("failed to update, try again later");
    }

    const current = data?.current;
    const { session_id, session } = data;

    if (current === "true") {
      const syncData = await updateData(
        "academic_session",
        data,
        "session_id",
        session_id,
        hqPool
      );

      await updateAllChildren(
        "academic_session",
        "year",
        "session_id",
        session,
        session_id,
        currentSessionId,
        hqPool
      );
      // console.log(data);
      return syncData;
    }

    return data;
  },
  branchUpdateSession: async (
    sessionData,
    currentSessionId,
    sessionExists,
    Pool
  ) => {
    // Call the function to update a product

    if (!sessionExists) {
      const data = await CreateData(
        "academic_session",
        sessionData,
        "session_id",
        currentSessionId,
        Pool
      );

      if (!data || Object.keys(data).length === 0) {
        throw new DataError("failed to create, try again later");
      }

      const current = data?.current;
      const { session_id, session } = data;

      if (current === "true") {
        await updateAllChildren(
          "academic_session",
          "year",
          "session_id",
          session,
          session_id,
          currentSessionId,
          Pool
        );
        // console.log(data);
      }

      return data;
    } else {
      const data = await updateData(
        "academic_session",
        sessionData,
        "session_id",
        currentSessionId,
        Pool
      );

      if (!data || Object.keys(data).length === 0) {
        connection.rollback();
        throw new DataError("failed to update, try again later");
      }

      const current = data?.current;
      const { session_id, session } = data;

      if (current === "true") {
        await updateAllChildren(
          "academic_session",
          "year",
          "session_id",
          session,
          session_id,
          currentSessionId,
          Pool
        );
        // console.log(data);
      }

      return data;
    }
  },
  syncCurrentSession: async (sessionData, pool, currentSessionId) => {
    // Call the function to update a product
    const sync = await CreateData(
      "academic_session",
      sessionData,
      "session_id",
      currentSessionId,
      pool
    );
    // console.log(sync);

    if (!sync || Object.keys(sync).length === 0) {
      throw new DataError("failed to update, try again later");
    }

    const { session_id, session } = sync;
    await updateAllChildren(
      "academic_session",
      "acamedic_year",
      "session_id",
      session,
      session_id,
      currentSessionId,
      pool
    );
    return sync;
  },
  assignstaffToBranch: async (staffId, branchId, hqId) => {
    const assign = await AssignStaffToBranch(staffId, branchId, hqId);
    return assign;
  },
};

module.exports = MainDB;
