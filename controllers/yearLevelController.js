const LevelFunction = require("../db_functions/year_level");
const { StatusCodes } = require("http-status-codes");
const checkId = require("../post-functions/functions/checksingleExistence");
const generateUUId = require("../post-functions/functions/generateUuid");
const { BadRequestError, NotFoundError, DataError } = require("../error");
const ValidateEntityExistence = require("../post-functions/functions/validateEntityExistence");
const checkoneExistence = require("../post-functions/functions/checkoneExistence");
const checkallExistence = require("../post-functions/functions/checkallExistence");
const fetchallExistence = require("../post-functions/fetchallExistence");
// const checkuuId = require("../post-functions/functions/checkUuid");

const createYearLevel = async (req, res, next) => {
  try {
    const { section_id, year_level } = req.body;

    const levelId = await generateUUId("year_level", "level_id", "LEVEL");
    if (
      !levelId ||
      levelId === "failed to generate unique id after 10 attempts"
    ) {
      return next(
        new BadRequestError(
          "Failed to generate a unique year level ID. Please try again."
        )
      );
    }

    const [resp, [sessionData], LevelId, levelName] = await Promise.all([
      checkoneExistence("sections", "section_id", section_id),
      fetchallExistence("academic_session", { current: "true" }),
      checkallExistence("year_level", { level_id: levelId, section_id }, "AND"),
      checkoneExistence("year_level", "year_level", year_level),
    ]);

    if (!resp) {
      throw new DataError(
        "Invalid section information. Please verify and try again."
      );
    }

    if (!sessionData) {
      return next(
        new NotFoundError(
          "No current academic session found. Please contact support."
        )
      );
    }

    if (LevelId || levelName) {
      return next(
        new DataError(
          "Year level eixsts, Please verify your details and try again."
        )
      );
    }

    const { session_id, session: year } = sessionData;

    req.body = { ...req.body, level_id: levelId, session_id, year };

    const levelProp = await LevelFunction.create(req.body, levelId);
    res.status(StatusCodes.CREATED).json({ levelProp });
  } catch (error) {
    next(error);
  }
};

const createClassType = async (req, res, next) => {
  try {
    const class_id = await generateUUId("class_type", "class_id", "CLASS");
    if (
      !class_id ||
      class_id === "failed to generate unique id after 10 attempts"
    ) {
      return next(
        new BadRequestError(
          "Failed to generate a unique class type ID. Please try again."
        )
      );
    }

    const [[sessionData]] = await Promise.all([
      fetchallExistence("academic_session", { current: "true" }),
    ]);

    if (!sessionData) {
      return next(
        new NotFoundError(
          "No current academic session found. Please contact support."
        )
      );
    }

    const { session_id, session: year } = sessionData;

    req.body = { ...req.body, session_id, year };

    req.body.class_id = class_id;

    const classProp = await LevelFunction.createClassType(req.body);
    return res.status(StatusCodes.CREATED).json({ classProp });
  } catch (error) {
    // console.log(error);
    next(error);
  }
};
const updateYearLevel = async (req, res, next) => {
  const { levelid: level_id } = req.params;
  const { section_id, year_level } = req.body;

  try {
    // Check if the year level exists
    const yearLevelExists = await checkoneExistence(
      "year_level",
      "level_id",
      level_id
    );

    const LevelName = await checkoneExistence(
      "year_level",
      "year_level",
      year_level
    );

    if (!yearLevelExists) {
      throw new DataError(
        "Year level information is not available or invalid. Please verify and try again."
      );
    }

    if (LevelName) {
      return next(
        new DataError("Year level name exists, input a new name and try again.")
      );
    }

    // Validate and section_id if provide.

    if (section_id) {
      await ValidateEntityExistence(
        "sections",
        "section_id",
        section_id,
        { level_id, section_id },
        "Section already linked to year level",
        "year_level",
        "AND"
      );
    }

    // Update the year level
    const updatedLevelId = await LevelFunction.update(req.body, level_id);

    return res.status(StatusCodes.OK).json({ updatedLevelId });
  } catch (error) {
    next(error);
  }
};
const updateClassType = async (req, res, next) => {
  const { classid: class_id } = req.params;

  try {
    const [classid] = await Promise.all([
      checkoneExistence("class_type", "class_id", class_id),
    ]);

    if (!classid) {
      return next(
        new DataError(
          "invalid class id, class id doesnt exist, Please verify your details and try again."
        )
      );
    }

    const classId = await LevelFunction.updateClassType(req.body, class_id);
    // console.log(userId);
    return res.status(StatusCodes.OK).json({ classId });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createYearLevel,
  createClassType,
  updateYearLevel,
  updateClassType,
};
