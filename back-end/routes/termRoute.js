const express = require("express");
const termController = require("../controllers/termController");

const router = express.Router();

router.post("/new-term/:hqid", termController.createTerm);
router.post("/new-half/:hqid", termController.createHalf);
router.put("/update-term/:hqid/:termid", termController.updateTerm);
router.put("/update-half/:hqid/:halfid", termController.updateHalf);
router.post("/sync-term/:branchid/:hqid", termController.syncTerm);
router.post("/sync-half/:branchid/:hqid", termController.syncHalf);

module.exports = router;
