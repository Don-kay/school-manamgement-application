const { StatusCodes } = require("http-status-codes");
const CustomAPIError = require("../error/customApi");

const errorHandlerMiddleware = (err, req, res, next) => {
  let customError = {
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    msg: err.message || "something went wrong, please try again",
  };
  //console.log(err);
  if (err instanceof CustomAPIError) {
    return res.status(err.statusCode).json({ msg: err.message });
  }

  if (err?.errno === 1265) {
    const errorMessage = err?.sqlMessage;

    const regex = /'([^']+)'/;

    // Extract the word using the regular expression
    const match = errorMessage.match(regex);

    if (match && match[1]) {
      customError.statusCode = StatusCodes.FORBIDDEN;
      customError.msg = `the values ${match[1]}: entry for ${match[0]} does not match db requirement, check entries and try again.`;
    } else {
      customError.statusCode = StatusCodes.FORBIDDEN;
      customError.msg = `no match found.`;
    }
  }
  if (err?.errno === 1292) {
    const errorMessage = err?.sqlMessage;

    const regex = /'(\d{4})'.*'(\w+)'/;

    // Extract the word using the regular expression
    const match = errorMessage.match(regex);

    if (match && match[1] && match[2]) {
      customError.statusCode = StatusCodes.FORBIDDEN;
      customError.msg = `wrong value entered for ${match[2]}: ${match[1]}, check entries and try again.`;
    } else {
      customError.statusCode = StatusCodes.FORBIDDEN;
      customError.msg = `no match found.`;
    }
  }
  if (err?.errno === 1062) {
    const errorMessage = err?.sqlMessage;

    const regex = /\.([a-zA-Z0-9]+)_/;

    // Extract the word using the regular expression
    const match = errorMessage.match(regex);

    if (match && match[1]) {
      customError.statusCode = StatusCodes.FORBIDDEN;
      customError.msg = `duplicate entry for ${match[1]}, check entries and try again.`;
    } else {
      customError.statusCode = StatusCodes.FORBIDDEN;
      customError.msg = `duplicate entry, please verify and try again`;
    }
  }

  if (err?.errno === 1452) {
    const errorMessage = err?.sqlMessage;

    // Split the error message by space and special characters like ` and ( )
    const words = errorMessage.split(/[\s`(),.]+/);

    // Find the positions of the target keywords in the array
    const referenceIndex = words.indexOf("REFERENCES");
    const onIndex = words.indexOf("ON");

    // Dynamically extract the words in the same text order
    if (referenceIndex !== -1 && onIndex !== -1) {
      const table = words[referenceIndex + 1];
      const tableid = words[referenceIndex + 2];

      customError.statusCode = StatusCodes.FORBIDDEN;
      customError.msg = `fatal error ::) ${tableid} is invalid, recheck the id and trying again.`;
    } else {
      customError.statusCode = StatusCodes.FORBIDDEN;
      customError.msg = `no match found.`;
    }

    // console.log(err.error.error.keyValue);
    // console.log(err.sql);
  }

  //console.error(err.stack || err);

  // Determine the error response status and message
  // const statusCode = err.statusCode || 500;
  // const message = err || "Internal Server Error";

  res.status(customError.statusCode).json({
    status: customError.statusCode,
    // err,
    error: {
      message: customError.msg || "Internal Server Error",
      code: customError.code || "UNKNOWN_ERROR",
      errno: customError.errno || null,
      sql: customError.sql || null,
      sqlState: customError.sqlState || null,
      sqlMessage: customError.sqlMessage || null,
    },
  });
  // Send the error response
  // res.status(customError.statusCode).json(customError.msg);
  // next();
};

module.exports = errorHandlerMiddleware;
