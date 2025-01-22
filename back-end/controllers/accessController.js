const {
  createJwt,
  comparePassword,
  logoutJwt,
} = require("../config/passwordConfig");
const { masterPool, getBranchPool } = require("../config/connection");
const { StatusCodes } = require("http-status-codes");
const {
  BadRequestError,
  NotFoundError,
  MissingFieldsError,
  UnauthorizedError,
} = require("../error");
const fetchallExistence = require("../post-functions/fetchallExistence");
const FetchSinglemainDB = require("../post-functions/branchDB/fetchSinglemainDB");
const GenerateUUId = require("../post-functions/functions/generateUuid");
const CreateData = require("../post-functions/createData");
const checkallExistence = require("../post-functions/functions/checkallExistence");
const checkoneExistence = require("../post-functions/functions/checkoneExistence");

const login = async (req, res, next) => {
  const { branchid: branch_id } = req.params;
  const { official_email, password } = req.body;

  if (!official_email || !password) {
    return next(new MissingFieldsError("please fill in all required fields"));
  }

  try {
    // Step 1: Validate User in master_db
    const [branch] = await masterPool.query(
      "SELECT * FROM branches WHERE branch_id = ?",
      [branch_id]
    );

    if (branch.length === 0) {
      return next(new UnauthorizedError("Invalid branch_id"));
    }

    const branchPool = await getBranchPool(branch_id);

    const emailCorrect = await checkoneExistence(
      "staff",
      "official_email",
      official_email,
      branchPool
    );

    if (!emailCorrect) {
      return next(
        new UnauthorizedError(
          `failed to login. Invalid credentials: ${official_email}`
        )
      );
    }

    const emailExist = await fetchallExistence(
      "staff",
      { official_email, branch_id },
      branchPool
    );

    if (!emailExist) {
      return next(
        new UnauthorizedError(
          `failed to login. You are authorized to access this branch. verify and try again`
        )
      );
    }

    // console.log(password);
    const user = emailExist[0];

    const passwordMatch = await comparePassword(password, user.password);

    if (!passwordMatch) {
      return next(
        new UnauthorizedError(
          `failed to login. Invalid credentials: ${password}`
        )
      );
    }

    if (branch_id !== user.branch_id) {
      return next(
        new BadRequestError(
          "attempted data access breach, please reconfirm your entries and try again"
        )
      );
    }

    // Check if a session already exists for the user
    const [existingSession] = await branchPool.query(
      "SELECT * FROM cookie_sessions WHERE staff_id = ?",
      [user.staff_id]
    );

    if (existingSession.length > 0) {
      // Option 2: Delete existing session
      await branchPool.query("DELETE FROM cookie_sessions WHERE staff_id = ?", [
        user.staff_id,
      ]);
    }

    const session_id = await GenerateUUId(
      "cookie_sessions",
      "session_id",
      "COOKIE",
      branchPool
    );

    const { staff_id, firstname, role_id, image, title, surname } = user;

    const token = createJwt(
      staff_id,
      firstname,
      official_email,
      role_id,
      branch_id,
      session_id
    );

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hour
    //const expiresAt = new Date(Date.now() + 1 * 60 * 1000); //1 minute

    // console.log(expiresAt);
    // console.log(session_id);

    const createSession = await CreateData(
      "cookie_sessions",
      { staff_id, session_id, expiresAt },
      "session_id",
      session_id,
      branchPool
    );

    return res
      .cookie("token", token, {
        httpOnly: false,
        secure: true,
        sameSite: "none",
        expires: expiresAt,
        // maxAge: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
        path: "/",
      })
      .status(StatusCodes.ACCEPTED)
      .json({
        msg: "successfully logged in",
        staff: staff_id,
        firstname,
        surname,
        official_email,
        role_id,
        image,
        title,
        branch_id: user.branch_id,
        session: createSession,
      });
  } catch (error) {
    // console.log(error);
    return next(error);
  }
};
// const hqLogout = async (req, res, next) => {
//   const { id: staff_id } = req.params;

//   const [branch] = await masterPool.query(
//     "SELECT * FROM branches WHERE branch_id = ?",
//     [branch_id]
//   );

//   if (branch.length === 0) {
//     return next(new UnauthorizedError("Invalid branch_id"));
//   }

//   const branchPool = await getBranchPool(branch_id);

//   const staffExist = await FetchSingleData("staff", "staff_id", staff_id);

//   if (!staffExist) {
//     return next(new NotFoundError("sorry staff does not exist"));
//   }

//   const { firstname, surname, email, role_id, image, title, branch_id } =
//     staffExist;

//   const logout = await logoutJwt(
//     staffExist.staff_id,
//     firstname,
//     email,
//     role_id,
//     branch_id
//   );

//   try {
//     return res
//       .cookie("token", logout, {
//         httpOnly: false,
//         secure: true,
//         sameSite: "none",
//         path: "/",
//       })
//       .status(StatusCodes.ACCEPTED)
//       .json({ staff_id, firstname, surname, email, role_id, image, title });
//   } catch (error) {
//     // console.log(error);
//     return next(error);
//   }
// };
const logout = async (req, res, next) => {
  const { id: staff_id, branchid: branch_id } = req.params;
  const branchPool = await getBranchPool(branch_id);

  const [data] = await masterPool.query(
    "SELECT * FROM branches WHERE branch_id = ?",
    [branch_id]
  );

  if (data?.length === 0) {
    return next(new UnauthorizedError("Invalid branch_id"));
  }

  const isAuth = await checkallExistence(
    "staff",
    { staff_id, branch_id },
    "AND",
    branchPool
  );

  if (!isAuth) {
    return next(
      new NotFoundError("complicated issue, insufficient route access")
    );
  }

  const [staffExist] = await fetchallExistence(
    "staff",
    { staff_id, branch_id },
    branchPool
  );

  if (!staffExist) {
    return next(new NotFoundError("sorry staff does not exist"));
  }

  const hqDB = await FetchSinglemainDB("branches", "hq", "true");
  if (!hqDB) {
    return next(new UnauthorizedError("invalid HQ access"));
  }

  const { firstname, surname, email, role_id, image, title } = staffExist;
  // console.log(staffExist);
  const logout = await logoutJwt(staffExist.staff_id, branchPool);

  try {
    return (
      res
        // .cookie("token", logout, {
        //   httpOnly: false,
        //   secure: true,
        //   sameSite: "none",
        //   path: "/",
        // })
        .status(StatusCodes.OK)
        .json({ logout })
    );
  } catch (error) {
    // console.log(error);
    return next(error);
  }
};

module.exports = { login, logout };

//remember to log in using the new logic
