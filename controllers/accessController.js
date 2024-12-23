const {
  createJwt,
  comparePassword,
  logoutJwt,
} = require("../config/passwordConfig");
const { StatusCodes } = require("http-status-codes");
const {
  BadRequestError,
  NotFoundError,
  MissingFieldsError,
  UnauthorizedError,
} = require("../error");
const FetchSingleData = require("../post-functions/fetchSingleInputedData");
const checkoneExistence = require("../post-functions/functions/checkoneExistence");

const login = async (req, res, next) => {
  const { official_email, password } = req.body;

  if (!official_email || !password) {
    return next(new MissingFieldsError("please fill in all required fields"));
  }

  try {
    const emailExist = await FetchSingleData(
      "staff",
      "official_email",
      official_email
    );
    const passwordMatch = await comparePassword(password, emailExist.password);

    if (!emailExist) {
      return next(
        new UnauthorizedError("failed to login. Invalid credentials")
      );
    }
    if (!passwordMatch) {
      return next(
        new UnauthorizedError("failed to login. Invalid credentials")
      );
    }

    const { staff_id, firstname, role_id, image, title, surname, branch_id } =
      emailExist;

    const token = await createJwt(
      staff_id,
      firstname,
      official_email,
      role_id,
      branch_id
    );

    return res
      .cookie("token", token, {
        httpOnly: false,
        secure: true,
        sameSite: "none",
        maxAge: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
        path: "/",
      })
      .status(StatusCodes.ACCEPTED)
      .json({
        staff_id,
        firstname,
        surname,
        official_email,
        role_id,
        image,
        title,
      });
  } catch (error) {
    // console.log(error);
    return next(error);
  }
};
const logout = async (req, res, next) => {
  const { id: staff_id } = req.params;

  const staffExist = await checkoneExistence("staff", "staff_id", staff_id);

  if (!staffExist) {
    return next(new NotFoundError("sorry staff does not exist"));
  }

  const { firstname, surname, email, role_id, image, title, branch_id } =
    staffExist;

  const logout = await logoutJwt(
    staffExist.staff_id,
    firstname,
    email,
    role_id,
    branch_id
  );

  try {
    return res
      .cookie("token", logout, {
        httpOnly: false,
        secure: true,
        sameSite: "none",
        path: "/",
      })
      .status(StatusCodes.ACCEPTED)
      .json({ staff_id, firstname, surname, email, role_id, image, title });
  } catch (error) {
    // console.log(error);
    return next(error);
  }
};

module.exports = { login, logout };
