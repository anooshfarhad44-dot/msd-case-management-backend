const express = require("express");
const router  = express.Router();
const { getCases, getCaseById, createCase, updateCase, addNote, recordSupervision } = require("../controllers/caseController");
const { authenticate, authorize } = require("../middleware/auth");

router.use(authenticate);

router.get("/",                      getCases);
router.get("/:id",                   getCaseById);
router.post("/",                     authorize("director","admin","supervisor"), createCase);
router.patch("/:id",                 authorize("director","admin","supervisor","fee_earner"), updateCase);
router.post("/:id/notes",            addNote);
router.post("/:id/supervision",      authorize("director","supervisor","compliance"), recordSupervision);

module.exports = router;
