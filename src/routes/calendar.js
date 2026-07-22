const express = require("express");
const router = express.Router();
const { getCalendarEvents, createCalendarEvent } = require("../controllers/calendarController");
const { authenticate } = require("../middleware/auth");

router.use(authenticate);

router.get("/", getCalendarEvents);
router.post("/", createCalendarEvent);

module.exports = router;
