require("dotenv").config();
require("express-async-errors");

const express = require("express");
const session = require("express-session");
const bodyparser = require("body-parser");
const branchRouter = require("./routes/branchIdRouter");
const branchDBRouter = require("./routes/branchDBRouter");

const app = express();
const cors = require("cors");
const parentRouter = require("./routes/parentsRoute");
const learnerRouter = require("./routes/learnersRoute");
const sessionRouter = require("./routes/sessionsRoute");
const sectionRouter = require("./routes/sectionsRoute");
const levelRouter = require("./routes/levelsRoute");
const termRouter = require("./routes/termRoute");
const paymentRouter = require("./routes/paymentRoute");
const accessRouter = require("./routes/accessRoute");
const auxillaryRouter = require("./routes/auxillaryRouter");
const staffRouter = require("./routes/staffRoute");
const AcademicsRouter = require("./routes/academicsRouter");

const Authentication = require("./middleware/Authentication");
const errorHandlerMiddleware = require("./middleware/error-handler");
const notFoundMiddleware = require("./middleware/not-found");
const getBranchPoolWare = require("./middleware/getBranchPoolware");

app.use(bodyparser.json({ limit: "25mb" }));

app.use(
  bodyparser.urlencoded({
    limit: "25mb",
    extended: true,
    parameterLimit: 500000,
  })
);

app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// Use branchRouter for all routes that include `branchId`

app.use("/schoolmanagement/api", accessRouter);

app.use(Authentication);
app.use("/schoolmanagement/api", branchDBRouter);

app.use(getBranchPoolWare);
app.use("/schoolmanagement/api", branchRouter);
app.use("schoolmanagement/api", parentRouter);
app.use("/schoolmanagement/api", parentRouter);
app.use("/schoolmanagement/api", learnerRouter);
app.use("/schoolmanagement/api", sessionRouter);
app.use("/schoolmanagement/api", sectionRouter);
app.use("/schoolmanagement/api", levelRouter);
app.use("/schoolmanagement/api", termRouter);
app.use("/schoolmanagement/api", paymentRouter);
app.use("/schoolmanagement/api", auxillaryRouter);
app.use("/schoolmanagement/api", staffRouter);
app.use("/schoolmanagement/api", AcademicsRouter);

// app.use("/schoolmanagement/api", paymentinstallmentRouter);

app.use(errorHandlerMiddleware);
app.use(notFoundMiddleware);
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// DatabaseManager.checkConnection()
//   .then(() => {
//     app.listen(port, () => {
//       console.log(`Server is running on port ${port}`);
//     });
//   })
//   .catch((err) => {
//     console.log(
//       "Failed to start server due to database connection error:",
//       err
//     );
//     process.exit(1); // Exit the process with failure
//   });

// app.use(
//     session({
//         cookie: {
//             sameSite: "lax",
//             secure: true
//         },
//         resave: false,
//         saveUninitialized: false,
//         store: st
//     })
// )
