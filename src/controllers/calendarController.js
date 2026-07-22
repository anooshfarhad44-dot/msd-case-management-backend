const CalendarEvent = require("../models/CalendarEvent");
const Task = require("../models/Task");
const Matter = require("../models/Matter");

// GET /api/calendar
exports.getCalendarEvents = async (req, res, next) => {
  try {
    const { start, end } = req.query; // optional date range filtering

    let filter = {};
    if (start || end) {
      filter.startDate = {};
      if (start) filter.startDate.$gte = new Date(start);
      if (end) filter.startDate.$lte = new Date(end);
    }

    // 1. Get explicit calendar events (hearings, meetings)
    const events = await CalendarEvent.find(filter)
      .populate("matterId", "reference clientName")
      .populate("attendees", "name");

    // 2. Aggregate tasks with due dates
    let taskFilter = { dueDate: { $exists: true } };
    if (start) taskFilter.dueDate.$gte = new Date(start);
    if (end) taskFilter.dueDate.$lte = new Date(end);

    const tasks = await Task.find(taskFilter)
      .populate("caseId", "reference") // if mapped to case/matter
      .populate("assignedTo", "name");

    // 3. Aggregate matter key dates (nextActionDate, expiry dates)
    let matterFilter = { status: { $in: ["active", "pending"] } };
    const matters = await Matter.find(matterFilter).select("reference clientName nextActionDate keyDate immigration");

    // Format all items into a unified calendar structure
    const formattedEvents = [
      ...events.map(e => ({
        id: e._id,
        type: "event",
        title: e.title,
        start: e.startDate,
        end: e.endDate,
        matter: e.matterId,
        eventType: e.eventType,
        isLegalDeadline: e.isLegalDeadline
      })),
      ...tasks.map(t => ({
        id: t._id,
        type: "task",
        title: t.title,
        start: t.dueDate,
        end: t.dueDate,
        assignedTo: t.assignedTo,
        status: t.status
      }))
    ];

    matters.forEach(m => {
      if (m.nextActionDate && (!start || m.nextActionDate >= new Date(start)) && (!end || m.nextActionDate <= new Date(end))) {
        formattedEvents.push({
          id: `m-action-${m._id}`,
          type: "deadline",
          title: `Next Action: ${m.reference}`,
          start: m.nextActionDate,
          end: m.nextActionDate,
          matter: m
        });
      }
      if (m.keyDate && (!start || m.keyDate >= new Date(start)) && (!end || m.keyDate <= new Date(end))) {
        formattedEvents.push({
          id: `m-key-${m._id}`,
          type: "deadline",
          title: `Key Date: ${m.reference}`,
          start: m.keyDate,
          end: m.keyDate,
          matter: m
        });
      }
      if (m.immigration?.leaveExpiryDate && (!start || m.immigration.leaveExpiryDate >= new Date(start)) && (!end || m.immigration.leaveExpiryDate <= new Date(end))) {
        formattedEvents.push({
          id: `m-imm-${m._id}`,
          type: "deadline",
          title: `Visa Expiry: ${m.reference}`,
          start: m.immigration.leaveExpiryDate,
          end: m.immigration.leaveExpiryDate,
          matter: m,
          isLegalDeadline: true
        });
      }
    });

    res.json({ success: true, events: formattedEvents });
  } catch (err) { next(err); }
};

// POST /api/calendar
exports.createCalendarEvent = async (req, res, next) => {
  try {
    const { matterId, title, description, eventType, startDate, endDate, location, attendees, isLegalDeadline } = req.body;
    
    if (!title || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: "Title, start date, and end date are required" });
    }

    const event = await CalendarEvent.create({
      matterId, title, description, eventType, startDate, endDate, location, attendees, isLegalDeadline,
      createdBy: req.user._id
    });

    res.status(201).json({ success: true, event });
  } catch (err) { next(err); }
};
