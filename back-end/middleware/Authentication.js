const jwt = require("jsonwebtoken");
const { getBranchPool } = require("../config/connection");
const {
  UnauthenticatedError,
  NotFoundError,
  UnauthorizedError,
} = require("../error/index");

const isBranchRoute = (pathname) => {
  return pathname.startsWith("/branch");
};
const isNotLoginRoute = (pathname) => {
  return !pathname.startsWith("/dome");
};
const isStudenDashboard = (pathname) => {
  return pathname === "/panel/student_dashboard";
};
const PanelRoute = (pathname) => {
  return pathname.startsWith("/panel/admin_dashboard");
};

const auth = async (req, res, next) => {
  //check if theres no token in headers
  const AuthHeader = req.headers.cookie || req.headers.Cookie;
  // console.log(AuthHeader);
  if (!AuthHeader || !AuthHeader.startsWith("token")) {
    return next(
      new UnauthenticatedError("session expired, please login to access data")
    );
  }

  const token = AuthHeader.split("=")[1];

  //token has all the user details
  //attach the user to course route
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, (err, res) => {
      if (err) {
        return "token expired";
      }
      return res;
    });

    if (payload === "token expired") {
      return next(
        new UnauthenticatedError(
          "unauthenticated ::), please login and try again."
        )
      );
    }

    //
    if (!payload) {
      return next(new UnauthenticatedError("password doesnt match"));
    }

    const branchPool = await getBranchPool(payload.branch_id);

    const [rows] = await branchPool.query(
      "SELECT * FROM cookie_sessions WHERE session_id = ? AND expiresAt > NOW()",
      [payload.session_id]
    );

    if (rows.length === 0) {
      return next(new UnauthorizedError("Session invalid, please Re-login"));
    }

    req.staff = {
      staff_id: payload.staff_id,
      firstname: payload.firstname,
      email: payload.email,
      role_id: payload.role_id,
      branch_id: payload.branch_id,
      // token: verify,
    };

    req.branchId = payload.branch_id;
    const url = req.url;
    // if (isBranchRoute(url)) {
    //   const branchId = url.match(/([a-zA-Z0-9-]+\+BRANCH)/)[1];

    //   if (!branchId) {
    //     return next(
    //       new NotFoundError("request failed:: Branch id doesn't exist")
    //     );
    //   }
    //   // if (payload.branch_id !== branchId) {
    //   //   return next(
    //   //     new UnauthorizedError(
    //   //       "access denied ::) you are not authorized to access this branch"
    //   //     )
    //   //   );
    //   // }

    //   req.branchId = branchId;
    // }

    next();
  } catch (error) {
    return next(error);
  }
};
module.exports = auth;
