const TermFunction = require("../db_functions/terms");
const generateUUId = require("../post-functions/functions/generateUuid");
const checkId = require("../post-functions/functions/checksingleExistence");
const { StatusCodes } = require("http-status-codes");
const { BadRequestError } = require("../error");
const checkoneExistence = require("../post-functions/functions/checkoneExistence");

const createTerm = async (req, res, next) => {
  // console.log(section_id);
  try {
    const term_id = await generateUUId("terms", "term_id", "TERM");

    const [[currentSession]] = await Promise.all([
      fetchallExistence("academic_session", {
        current: "true",
      }),
    ]);

    if (!currentSession) {
      return next(
        new NotFoundError("sorry, no current year set, please contact support")
      );
    }

    if (
      !term_id ||
      term_id === "failed to generate unique id after 10 attempts"
    ) {
      return next(
        new BadRequestError(
          "Failed to generate a unique staff ID. Please try again."
        )
      );
    }

    const year = currentSession.session;

    req.body = {
      ...req.body,
      year,
    };

    const termProp = await TermFunction.create(req.body, term_id);

    return res.status(StatusCodes.CREATED).json(termProp);
  } catch (error) {
    return next();
  }
};
const updateTerm = async (req, res, next) => {
  const { termid: term_id } = req.params;

  const idPresent = await checkoneExistence("terms", "term_id", term_id);

  try {
    if (!idPresent) {
      return next(
        new BadRequestError(`term with id: ${term_id} doesn't exist.`)
      );
    }
    const termId = await TermFunction.update(req.body, term_id);
    // console.log(userId);
    res.status(StatusCodes.CREATED).json({ termId });
  } catch (error) {
    next(error);
  }
};

module.exports = { createTerm, updateTerm };
