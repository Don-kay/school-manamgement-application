const express = require("express");
const learnerController = require("../controllers/learnersController");
const AuthenticateRoles = require("../middleware/AuthenticateRoles");

const router = express.Router();

router.post(
  "/branch/new-learners/:alias/:branchid",
  // AuthenticateRoles("MANAGE_STUDENT"),
  learnerController.createLearner
);
router.put(
  "/update-learner/:alias/:branchid/:learnerid",
  // AuthenticateRoles("MANAGE_STUDENT"),
  learnerController.updateLearner
);
router.delete(
  "/delink-learner/:alias/:branchid/:learnerid",
  // AuthenticateRoles("MANAGE_STUDENT"),
  learnerController.delinkLearner
);
router.put(
  "/link-learner/:alias/:branchid/:learnerid",
  // AuthenticateRoles("MANAGE_STUDENT"),
  learnerController.linkLearner
);

module.exports = router;
