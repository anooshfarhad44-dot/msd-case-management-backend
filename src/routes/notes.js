const express = require("express");
const router  = express.Router();
const { getNotes, createNote, updateNote, lockNote, signOffNote, getNoteVersions } = require("../controllers/noteController");
const { authenticate, authorize } = require("../middleware/auth");

router.use(authenticate);

router.get("/",              getNotes);
router.post("/",             createNote);
router.patch("/:id",         updateNote);
router.post("/:id/lock",     authorize("director","admin","supervisor"), lockNote);
router.post("/:id/signoff",  authorize("director","admin","supervisor"), signOffNote);
router.get("/:id/versions",  getNoteVersions);

module.exports = router;
