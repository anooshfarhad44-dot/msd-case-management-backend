const Case  = require("../models/Case");
const User  = require("../models/User");
const Task  = require("../models/Task");
const { generateReference } = require("../models/Case");
const { createAuditLog } = require("../utils/audit");

// GET /api/cases
const getCases = async (req, res, next) => {
  try {
    const { search, status, risk, assignedTo, page = 1, limit = 100 } = req.query;
    const filter = {};

    // Fee earners only see their own cases
    if (req.user.role === "fee_earner") filter.assignedTo = req.user.userId;
    else if (assignedTo && assignedTo !== "all") filter.assignedTo = assignedTo;

    if (status && status !== "all") filter.status = status;
    if (risk   && risk   !== "all") filter.risk   = risk;
    if (search) {
      filter.$or = [
        { reference:  { $regex: search, $options: "i" } },
        { type:       { $regex: search, $options: "i" } },
      ];
    }

    const cases = await Case.find(filter)
      .populate("clientId",   "firstName lastName email")
      .populate("assignedTo", "name email")
      .sort({ keyDate: 1, createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Case.countDocuments(filter);

    res.json({
      success: true,
      total,
      cases: cases.map((c) => ({
        id:             c._id,
        reference:      c.reference,
        clientId:       c.clientId?._id,
        clientName:     c.clientId ? `${c.clientId.firstName} ${c.clientId.lastName}` : "",
        assignedTo:     c.assignedTo?._id,
        assignedToName: c.assignedTo?.name || "",
        type:           c.type,
        stage:          c.stage,
        status:         c.status,
        priority:       c.priority,
        risk:           c.risk,
        fee:            c.fee,
        owed:           c.outstanding,
        keyDate:        c.keyDate,
        openedAt:       c.openedAt,
        updatedAt:      c.updatedAt,
        tags:           c.tags,
      })),
    });
  } catch (err) { next(err); }
};

// GET /api/cases/:id
const getCaseById = async (req, res, next) => {
  try {
    const cas = await Case.findById(req.params.id)
      .populate("clientId",     "firstName lastName email phone address amlStatus identityVerified")
      .populate("assignedTo",   "name email role")
      .populate("supervisedBy", "name email")
      .populate("createdBy",    "name");

    if (!cas) return res.status(404).json({ success: false, message: "Case not found" });

    // Fee earner can only view own cases
    if (req.user.role === "fee_earner" && cas.assignedTo?._id.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const tasks = await Task.find({ caseId: cas._id }).populate("assignedTo", "name");
    res.json({ success: true, case: cas, tasks });
  } catch (err) { next(err); }
};

// POST /api/cases
const createCase = async (req, res, next) => {
  try {
    const { clientId, assignedToId, type, subType, description, fee, keyDate, risk, billingType, conflictCheckDone, cddComplete, supervisedById } = req.body;
    if (!clientId || !assignedToId || !type) {
      return res.status(400).json({ success: false, message: "clientId, assignedToId and type are required" });
    }

    // Get assigned user initials for reference
    const assignee = await User.findById(assignedToId);
    const initials = assignee ? assignee.name.split(" ").map((w) => w[0]).join("").slice(0, 2) : "XX";
    const reference = generateReference(initials, type);

    const cas = await Case.create({
      reference,
      clientId,
      assignedTo:   assignedToId,
      supervisedBy: supervisedById,
      createdBy:    req.user.userId,
      type, subType, description, fee, keyDate, risk, billingType,
      conflictCheckDone: conflictCheckDone || false,
      cddComplete:       cddComplete || false,
      outstanding:       fee || 0,
    });

    await createAuditLog(req, "CREATE", "Case", cas._id, `Opened case: ${reference} (${type})`);
    res.status(201).json({ success: true, case: cas });
  } catch (err) { next(err); }
};

// PATCH /api/cases/:id
const updateCase = async (req, res, next) => {
  try {
    const cas = await Case.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!cas) return res.status(404).json({ success: false, message: "Case not found" });
    await createAuditLog(req, "UPDATE", "Case", cas._id, `Updated case: ${cas.reference}`);
    res.json({ success: true, case: cas });
  } catch (err) { next(err); }
};

// POST /api/cases/:id/notes
const addNote = async (req, res, next) => {
  try {
    const { text, isPrivate } = req.body;
    if (!text) return res.status(400).json({ success: false, message: "Note text is required" });
    const cas = await Case.findByIdAndUpdate(
      req.params.id,
      { $push: { notes: { text, isPrivate: isPrivate || false, createdBy: req.user.userId } } },
      { new: true }
    );
    if (!cas) return res.status(404).json({ success: false, message: "Case not found" });
    await createAuditLog(req, "CREATE", "CaseNote", cas._id, "Note added");
    res.json({ success: true, notes: cas.notes });
  } catch (err) { next(err); }
};

// POST /api/cases/:id/supervision
const recordSupervision = async (req, res, next) => {
  try {
    const { findings, actionItems } = req.body;
    const cas = await Case.findById(req.params.id);
    if (!cas) return res.status(404).json({ success: false, message: "Case not found" });

    // Calculate next due date based on cadence
    const now = new Date();
    const next = new Date(now);
    if (cas.supervisionCadence === "monthly")    next.setMonth(next.getMonth() + 1);
    else if (cas.supervisionCadence === "6weekly") next.setDate(next.getDate() + 42);
    else if (cas.supervisionCadence === "quarterly") next.setMonth(next.getMonth() + 3);

    cas.supervisionRecords.push({ recordedBy: req.user.userId, findings, actionItems, nextDueDate: next });
    cas.lastSupervisionDate = now;
    cas.nextSupervisionDate = next;
    await cas.save();

    await createAuditLog(req, "CREATE", "Supervision", cas._id, `Supervision recorded for ${cas.reference}`);
    res.json({ success: true, message: "Supervision recorded", nextDue: next });
  } catch (err) { next(err); }
};

module.exports = { getCases, getCaseById, createCase, updateCase, addNote, recordSupervision };
