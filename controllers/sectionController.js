const SectionFunction = require("../db_functions/section");
const generateUUId = require("../post-functions/functions/generateUuid");
const checkallExistence = require("../post-functions/functions/checkallExistence");
const { StatusCodes } = require("http-status-codes");
const {
  NotFoundError,
  DataError,
  BadRequestError,
  UnauthorizedError,
  Success,
} = require("../error");
const fetchallExistence = require("../post-functions/fetchallExistence");
const checkallDBExistence = require("../post-functions/branchDB/checkallDBExistence");
const checkoneExistence = require("../post-functions/functions/checkoneExistence");
const {
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
} = require("../post-functions/functions/dbTransactionHelper");
const { getBranchPool, masterPool } = require("../config/connection");
const { FetchDataByIds } = require("../post-functions/fetchMultipleData");

const createSection = async (req, res, next) => {
  const { hqid, branchid: branch_id, alias } = req.params;
  const { section_name } = req.body;

  const hqPool = req.branchPool;

  let hqConnection, branchConnection;
  hqConnection = await beginTransaction(hqPool);

  const branchPool = await getBranchPool(branch_id);
  branchConnection = await beginTransaction(branchPool);

  // console.log(section_id);
  try {
    const isHQ = await checkallDBExistence(
      "branches",
      { branch_id: hqid, hq: "true" },
      "AND"
    );
    if (!isHQ) {
      return next(new UnauthorizedError("invalid HQ access"));
    }

    if (!branch_id) {
      return next(
        new DataError("Unable to complete request, please specify a branch.")
      );
    }

    const [[data], branchData, checkSectionExists] = await Promise.all([
      fetchallExistence(
        "academic_session",
        {
          current: "true",
        },
        masterPool
      ),
      checkallDBExistence("branches", { branch_id, alias }, "AND"),
      checkallExistence(
        "sections",
        { branch_id, section_name },
        "AND",
        hqConnection
      ),
    ]);

    if (!data) {
      return next(
        new NotFoundError("sorry, no current year set, please contact support")
      );
    }

    const session_id = data.session_id;
    const year = data.session;

    if (!branchData) {
      return next(
        new NotFoundError(
          "Branch does not exist, check the entry and try again. If error persist, contact support"
        )
      );
    }

    if (checkSectionExists) {
      return next(new BadRequestError("Duplicate entry, section exists"));
    }

    const section_id = await generateUUId(
      "sections",
      "section_id",
      "SECTION",
      hqConnection
    );

    if (
      section_id === "failed to generate unique id after 10 attempts" ||
      !section_id
    ) {
      return next(
        new BadRequestError(
          "Failed to generate unique code ID, please try again."
        )
      );
    }

    req.body = { ...req.body, session_id, branch_id, section_id, year };

    const sectionProp = await SectionFunction.create(
      req.body,
      section_id,
      hqConnection,
      branchConnection
    );

    await commitTransaction(hqConnection);
    await commitTransaction(branchConnection);
    return res.status(StatusCodes.CREATED).json(sectionProp);
  } catch (error) {
    if (branchConnection) await rollbackTransaction(branchConnection);
    if (hqConnection) await rollbackTransaction(hqConnection);
    // console.log(error);
    next(error);
  }
};
const updateSection = async (req, res, next) => {
  const { hqid, sectionid: section_id, branchid, alias } = req.params;

  const hqPool = req.branchPool;

  let hqConnection, branchConnection;
  hqConnection = await beginTransaction(hqPool);

  const branchPool = await getBranchPool(branchid);
  branchConnection = await beginTransaction(branchPool);

  try {
    const isHQ = await checkallDBExistence(
      "branches",
      { branch_id: hqid, hq: "true" },
      "AND"
    );
    if (!isHQ) {
      return next(new UnauthorizedError("invalid HQ access"));
    }

    const branchData = await checkallExistence(
      "branches",
      { branch_id: branchid, alias },
      "AND",
      masterPool
    );

    if (!branchData) {
      return next(
        new NotFoundError(
          "Branch which request combination not found ::) invalid request"
        )
      );
    }

    const authorize = await checkallExistence(
      "sections",
      { section_id, branch_id: branchid },
      "AND",
      hqConnection
    );

    if (!authorize) {
      return next(
        new BadRequestError(
          `fatal error ::) failed to make updates. section with branch_id: ${branchid} doesn't exist`
        )
      );
    }

    // if (branch_id) {
    //   const isLinked = await checkallExistence(
    //     "sections",
    //     { section_id, branch_id },
    //     "AND"
    //   );

    //   if (isLinked) {
    //     return next(new DataError("branch already linked to this section."));
    //   }
    // }

    const sectionId = await SectionFunction.update(
      req.body,
      section_id,
      hqConnection,
      branchConnection
    );

    await commitTransaction(hqConnection);
    await commitTransaction(branchConnection);

    return res.status(StatusCodes.OK).json({ sectionId });
  } catch (error) {
    if (branchConnection) await rollbackTransaction(branchConnection);
    if (hqConnection) await rollbackTransaction(hqConnection);
    return next(error);
  }
};
// const copySection = async (req, res, next) => {
//   const { hqid } = req.params;
//   const { section_id } = req.body;

//   const hqPool = req.branchPool;
//   let branchConnection, hqConnection, branchPool, isNull;
//   // hqConnection = await beginTransaction(hqPool);

//   try {
//     const isHQ = await checkallDBExistence(
//       "branches",
//       { branch_id: hqid, hq: "true" },
//       "AND"
//     );

//     if (!isHQ) {
//       return next(new UnauthorizedError("invalid HQ access"));
//     }

//     const [sectionDetail] =
//       (await fetchallExistence("sections", { section_id }, hqPool)) || [];

//     if (!sectionDetail) {
//       return next(
//         new NotFoundError(`section with id: ${section_id} not found in HQ.`)
//       );
//     }

//     const sectionBranchid = sectionDetail.branch_id;

//     if (sectionBranchid !== null) {
//       isNull = false;
//       branchPool = await getBranchPool(sectionBranchid);

//       const [sectionExistInBranch] =
//         (await checkallExistence(
//           "sections",
//           { section_id, branch_id: sectionDetail.branch_id },
//           "AND",
//           branchPool
//         )) || [];

//       if (sectionExistInBranch) {
//         return next(
//           new Success(`section with id: ${section_id} already exist in Branch.`)
//         );
//       }
//     }

//     //Proceed with session creation logic (commented out for now)

//     const copyData = await SectionFunction.copy(
//       sectionDetail,
//       section_id,
//       branchPool
//     );

//     return res.status(StatusCodes.CREATED).json(copyData);
//   } catch (error) {
//     next(error);
//   }
// };
const syncSection = async (req, res, next) => {
  const { hqid, branchid: branch_id } = req.params;
  const { section_id } = req.body;

  //ensure the branchid is the params is directly gotten from the section created for the branch you are inputing

  const branchPool = req.branchPool;

  let branchConnection, hqConnection, hqPool;

  branchConnection = await beginTransaction(branchPool);

  try {
    if (req.branchId !== branch_id) {
      return next(new BadRequestError("invalid access to section data"));
    }

    const isHQ = await checkallDBExistence(
      "branches",
      { branch_id: hqid, hq: "true" },
      "AND"
    );

    if (!isHQ) {
      return next(new UnauthorizedError("invalid HQ access"));
    }

    hqPool = await getBranchPool(hqid);
    hqConnection = await beginTransaction(hqPool);

    const validData = await Promise.all(
      section_id.map(async (id) => {
        const isID = await checkallExistence(
          "sections",
          { section_id: id, branch_id: req.branchId },
          "AND",
          hqConnection
        );
        return isID; // Ensure you return the result so it's captured in validData
      })
    );

    if (validData.some((value) => !value)) {
      return next(
        new BadRequestError(
          "unable to complete process, you might have inputed a wrong section id"
        )
      );
    }

    const isBranch = await checkallExistence(
      "branch",
      { branch_id },
      "AND",
      branchConnection
    );

    if (!isBranch) {
      return next(
        new UnauthorizedError(
          `branch with id: ${branch_id} not found in mainDB.`
        )
      );
    }

    const fetchData = await FetchDataByIds(
      "sections",
      "section_id",
      section_id,
      hqConnection
    );

    const copyData = await SectionFunction.createMultiplSections(
      fetchData,
      branchConnection
    );

    await commitTransaction(branchConnection);
    await commitTransaction(hqConnection);
    return res.status(StatusCodes.CREATED).json(copyData);
  } catch (error) {
    if (branchConnection) await rollbackTransaction(branchConnection);
    if (hqConnection) await rollbackTransaction(hqConnection);
    next(error);
  }
};

module.exports = { createSection, updateSection, syncSection };
