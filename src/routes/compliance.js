const express = require("express");
const router  = express.Router();
const { getSupervisionQueue, getAMLRegister, getAuditLog, getComplianceStats } = require("../controllers/complianceController");
const { authenticate, authorize } = require("../middleware/auth");

router.use(authenticate, authorize("director","supervisor","compliance","admin"));

router.get("/supervision", getSupervisionQueue);
router.get("/aml",         getAMLRegister);
router.get("/audit",       getAuditLog);
router.get("/stats",       getComplianceStats);

module.exports = router;
