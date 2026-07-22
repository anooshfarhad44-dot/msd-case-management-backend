const express = require("express");
const router  = express.Router();
const { getLeads, createLead, updateLead, convertLead } = require("../controllers/leadController");
const { authenticate, authorize } = require("../middleware/auth");

router.use(authenticate, authorize("director","admin","supervisor","sales","finance"));

router.get("/",            getLeads);
router.post("/",           createLead);
router.patch("/:id",       updateLead);
router.post("/:id/convert", authorize("director","admin"), convertLead);

module.exports = router;
