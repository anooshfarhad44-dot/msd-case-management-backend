const express = require("express");
const router  = express.Router();
const {
  getMatters, getMatterById, createMatter, updateMatter,
  closeMatter, reopenMatter, getTimeline, bulkUpdateStage,
  previewMatterTypeChange, recordImmigrationSignOff, completeRetrospectiveReview,
  addParty, removeParty, updateParty, updateChecklistItem, addNote,
} = require("../controllers/matterController");
const { authenticate, authorize } = require("../middleware/auth");

router.use(authenticate);

// Matter CRUD
router.get("/",    getMatters);
router.post("/bulk-stage", authorize("director","admin","supervisor"), bulkUpdateStage);
router.get("/:id", getMatterById);
router.post("/",   authorize("director","admin","supervisor","fee_earner"), createMatter);
router.patch("/:id", authorize("director","admin","supervisor","fee_earner","paralegal"), updateMatter);

// Close / Reopen
router.post("/:id/close",  authorize("director","admin","supervisor","fee_earner"), closeMatter);
router.post("/:id/reopen", authorize("director","admin","supervisor"), reopenMatter);

// Timeline (supports ?type=&from=&to=&format=csv)
router.get("/:id/timeline", getTimeline);
router.post("/:id/impact-preview", authorize("director","admin","supervisor","fee_earner"), previewMatterTypeChange);
router.post("/:id/immigration-signoff", authorize("director","admin","supervisor"), recordImmigrationSignOff);
router.post("/:id/retrospective-review", authorize("director","admin","supervisor"), completeRetrospectiveReview);

// Notes
router.post("/:id/notes", addNote);

// Parties
router.post("/:id/parties",             addParty);
router.patch("/:id/parties/:partyId",   updateParty);
router.delete("/:id/parties/:partyId",  removeParty);

// Checklist
router.patch("/:id/checklist/:itemId",  updateChecklistItem);

const { getCommunications, createCommunication } = require("../controllers/communicationController");
const { getTimeEntries, createTimeEntry, getExpenses, createExpense } = require("../controllers/timeExpenseController");

// Communications
router.get("/:id/communications", getCommunications);
router.post("/:id/communications", createCommunication);

// Time and Expenses
router.get("/:id/time", getTimeEntries);
router.post("/:id/time", createTimeEntry);
router.get("/:id/expenses", getExpenses);
router.post("/:id/expenses", createExpense);

module.exports = router;
