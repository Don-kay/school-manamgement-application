const PaymentFunction = require("../db_functions/payments");
const generateUUId = require("../post-functions/functions/generateUuid");
const checkallExistence = require("../post-functions/functions/checkallExistence");
const FetchSingleData = require("../post-functions/fetchSingleInputedData");
const {
  BadRequestError,
  DataError,
  UnauthorizedError,
} = require("../error/index");
const { StatusCodes } = require("http-status-codes");

const Payments = async (req, res, next) => {
  const { learner_id, level_id } = req.body;
  const { parentid } = req.params;

  try {
    const paymentId = await generateUUId("payment_status", "payment_id", "PAY");
    const invoiceId = await generateUUId("invoices", "invoice_id", "INVOICE");

    if (
      paymentId === "failed to generate unique id after 10 attempts" ||
      invoiceId === "failed to generate unique id after 10 attempts"
    ) {
      throw new DataError(
        "Failed to generate unique payment or invoice ID after multiple attempts. Please try again later."
      );
    }

    const levelData = await FetchSingleData("year_level", "level_id", level_id);

    if (
      !levelData ||
      Object.keys(levelData).length === 0 ||
      levelData.msg?.match(/[a-zA-Z]/)
    ) {
      throw new DataError(
        "unable to process fees, invalid details. Please check the level details and try again."
      );
    }
    const section_id = levelData.section_id;

    const sectionData = await FetchSingleData(
      "sections",
      "section_id",
      section_id
    );
    const isParentLearnerLinked = await checkallExistence("parents_learners", {
      parent_id: parentid,
      learner_id,
    });

    if (
      !sectionData ||
      Object.keys(sectionData).length === 0 ||
      sectionData.msg?.match(/[a-zA-Z]/)
    ) {
      throw new DataError(
        "Fees information is not available or invalid. Please check the section details and try again."
      );
    }

    if (!isParentLearnerLinked) {
      throw new UnauthorizedError(
        "You are not authorized to make this payment. Please check your permissions or contact support."
      );
    }

    req.body.amount_due = sectionData.fees;
    req.body.payment_id = paymentId;
    req.body.invoice_id = invoiceId;
    req.body.status = "completed";
    req.body.parent_id = parentid;
    req.body.section_id = section_id;

    const paymentResponse = await PaymentFunction.oneOffPayment(req.body);
    return res.status(StatusCodes.ACCEPTED).json({ payment: paymentResponse });
  } catch (error) {
    // console.log(error);
    next(error);
  }
};

const PaymentInstallment = async (req, res, next) => {
  const { invoice_id, level_id, learner_id } = req.body;
  const { parentid } = req.params;

  try {
    // Generate unique payment ID
    const paymentIdData = await generateUUId(
      "payment_status",
      "payment_id",
      "PAY"
    );
    const payment_id =
      paymentIdData === "failed to generate unique id after 10 attempts"
        ? null
        : paymentIdData;

    // Fetch section data

    const levelData = await FetchSingleData("year_level", "level_id", level_id);

    if (
      !levelData ||
      Object.keys(levelData).length === 0 ||
      levelData.msg?.match(/[a-zA-Z]/)
    ) {
      throw new DataError(
        "unable to process fees, invalid details. Please check the level details and try again."
      );
    }
    const section_id = levelData.section_id;

    const sectionData = await FetchSingleData(
      "sections",
      "section_id",
      section_id
    );

    // Check existence in parents_learners
    const parentLearnerExists = await checkallExistence("parents_learners", {
      parent_id: parentid,
      learner_id,
    });

    // Validate fetched section data
    if (
      !sectionData ||
      typeof sectionData !== "object" ||
      !Object.keys(sectionData).length ||
      sectionData.msg?.match(/[a-zA-Z]/)
    ) {
      throw new DataError("The fee information is either absent or invalid.");
    }

    // Validate required fields
    if (!invoice_id) {
      throw new BadRequestError(
        "invoice or payment ID is invalid, provide an invoice"
      );
    } else if (!payment_id) {
      throw new BadRequestError("failed to generate a payment id");
    } else if (!parentLearnerExists) {
      throw new UnauthorizedError(
        "You are not authorized to make this payment. Please check your permissions or contact support."
      );
    }

    // Prepare payment data
    req.body.payment_id = payment_id;
    req.body.status = "completed";
    req.body.parent_id = parentid;
    req.body.section_id = section_id;

    // Process payment
    const paymentResult = await PaymentFunction.installment(req.body);
    return res.status(StatusCodes.OK).json({ payment: paymentResult });
  } catch (error) {
    next(error);
  }
};

// const updateLearner = async (req, res) => {
//   const { learnerid } = req.params;
//   const learner_id = learnerid;

//   const object = req.body;
//   // const newObject = Object.keys(object).reduce((acc, key) => {
//   //   if (key !== "learner_id") {
//   //     acc[key] = object[key];
//   //   }
//   //   return acc;
//   // }, {});
//   const idPresent = await checkId(
//     "montessori_learners",
//     "learner_id",
//     learner_id
//   );
//   try {
//     if (idPresent.err === 404) {
//       return res
//         .status(StatusCodes.BAD_REQUEST)
//         .json({ msg: `user with id: ${learner_id}  doesn't exist` });
//     }
//     const userId = await LearnersFunction.update(object, learner_id);
//     res
//       .status(StatusCodes.CREATED)
//       .json({ msg: "successfully updated", userId });
//   } catch (error) {
//     // console.log(error);
//     res
//       .status(StatusCodes.BAD_REQUEST)
//       .json({ err: error, message: "Error updating learner" });
//   }
// };
// const delinkLearner = async (req, res) => {
//   const { learnerid } = req.params;

//   const { parent_id } = req.body;

//   const idPresent = await checkId("parents_learners", "parent_id", parent_id);
//   const data = { learner_id: learnerid, parent_id };
//   try {
//     if (idPresent.err === 404) {
//       res
//         .status(400)
//         .json({ msg: `user with id: ${parent_id}  doesn't exist` });
//     }
//     const userId = await LearnersFunction.delinkLearner(data);
//     res.status(StatusCodes.OK).json(userId);
//   } catch (error) {
//     res
//       .status(StatusCodes.BAD_REQUEST)
//       .json({ err: error, message: "Error updating learner" });
//   }
// };
// const linkLearner = async (req, res) => {
//   const { learnerid } = req.params;
//   const { parent_id } = req.body;
//   const linkId = await generateUUId(
//     "parents_learners",
//     "parents_learners_id",
//     "PARLRN"
//   );
//   const parentsLearnerId =
//     linkId === "failed to generate unique id after 10 attempts" ? null : linkId;

//   const idPresent = await checkId("parents_learners", "parent_id", parent_id);
//   try {
//     if (idPresent.err === 404) {
//       return res
//         .status(StatusCodes.BAD_REQUEST)
//         .json({ msg: `user with id: ${parent_id}  doesn't exist` });
//     }
//     const data = { learner_id: learnerid, parent_id };
//     data.parents_learners_id = parentsLearnerId;
//     const userId = await LearnersFunction.linkLearner(data);
//     // console.log(userId);
//     return res.status(StatusCodes.OK).json(userId);
//   } catch (error) {
//     return res
//       .status(StatusCodes.BAD_REQUEST)
//       .json({ err: error, message: "Error linking learner" });
//   }
// };

module.exports = { Payments, PaymentInstallment };
