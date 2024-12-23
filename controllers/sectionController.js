const SectionFunction = require("../db_functions/section");
const generateUUId = require("../post-functions/functions/generateUuid");
const checkallExistence = require("../post-functions/functions/checkallExistence");
const { StatusCodes } = require("http-status-codes");
const { NotFoundError, DataError, BadRequestError } = require("../error");
const fetchallExistence = require("../post-functions/fetchallExistence");

const createSection = async (req, res, next) => {
  const { branchid: branch_id, alias } = req.params;
  const { section_name } = req.body;

  // console.log(section_id);
  try {
    if (!branch_id) {
      return next(
        new DataError("Unable to complete request, please specify a branch.")
      );
    }

    const [[data], branchData, checkSectionExists] = await Promise.all([
      fetchallExistence("academic_session", {
        current: "true",
      }),
      checkallExistence("branch", { branch_id, alias }, "AND"),
      checkallExistence("sections", { branch_id, section_name }, "AND"),
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

    const section_id = await generateUUId("sections", "section_id", "SECTION");

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

    const sectionProp = await SectionFunction.create(req.body, section_id);
    return res.status(StatusCodes.CREATED).json(sectionProp);
  } catch (error) {
    // console.log(error);
    next(error);
  }
};
const updateSection = async (req, res, next) => {
  const { sectionid: section_id, branchid, alias } = req.params;

  const { branch_id } = req.body;

  try {
    const branchData = await checkallExistence(
      "branch",
      { branch_id: branchid, alias },
      "AND"
    );

    const authorize = await checkallExistence(
      "sections",
      { section_id, branch_id: branchid },
      "AND"
    );

    if (!branchData) {
      return next(
        new NotFoundError(
          "Branch which request combination not found ::) invalid request"
        )
      );
    }

    if (!authorize) {
      throw new BadRequestError(`fatal error ::) unauthorized to make updates`);
    }

    if (branch_id) {
      const isLinked = await checkallExistence(
        "sections",
        { section_id, branch_id },
        "AND"
      );

      if (isLinked) {
        return next(new DataError("branch already linked to this section."));
      }
    }

    const sectionId = await SectionFunction.update(req.body, section_id);

    return res.status(StatusCodes.OK).json({ sectionId });
  } catch (error) {
    next(error);
  }
};

module.exports = { createSection, updateSection };
