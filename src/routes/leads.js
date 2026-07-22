const express = require("express");
const router  = express.Router();
const { getLeads, createLead, updateLead } = require("../controllers/leadController");
const { authenticate, authorize } = require("../middleware/auth");

router.use(authenticate, authorize("director","admin","supervisor","sales"));

router.get("/",       getLeads);
router.post("/",      createLead);
router.patch("/:id",  updateLead);

module.exports = router;
