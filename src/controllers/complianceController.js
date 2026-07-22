const Case     = require("../models/Case");
const AuditLog = require("../models/AuditLog");
const Client   = require("../models/Client");

// GET /api/compliance/supervision
const getSupervisionQueue = async (req, res, next) => {
  try {
    const today = new Date();

    const cases = await Case.find({ status: { $in: ["open", "pending"] } })
      .populate("assignedTo",   "name")
      .populate("supervisedBy", "name")
      .populate("clientId",     "firstName lastName")
      .select("reference risk supervisionCadence lastSupervisionDate nextSupervisionDate assignedTo supervisedBy clientId");

    const queue = cases.map((c) => {
      const overdueDays = c.nextSupervisionDate
        ? Math.max(0, Math.floor((today - new Date(c.nextSupervisionDate)) / 86400000))
        : 0;
      return {
        id:              c._id,
        ref:             c.reference,
        client:          c.clientId ? `${c.clientId.firstName} ${c.clientId.lastName[0]}.` : "—",
        cw:              c.assignedTo?.name?.split(" ").map((w) => w[0]).join("") || "—",
        risk:            c.risk,
        cadence:         c.supervisionCadence,
        last:            c.lastSupervisionDate,
        due:             c.nextSupervisionDate,
        overdueDays,
      };
    }).sort((a, b) => b.overdueDays - a.overdueDays);

    res.json({ success: true, queue });
  } catch (err) { next(err); }
};

// GET /api/compliance/aml
const getAMLRegister = async (req, res, next) => {
  try {
    const clients = await Client.find()
      .sort({ amlStatus: 1 })
      .select("firstName lastName email amlStatus identityVerified identityDocType identityDocExpiry sourceOfFunds amlScreeningRef amlScreeningDate amlNextReview pepStatus sanctionsClear");

    res.json({
      success: true,
      register: clients.map((c) => ({
        id:               c._id,
        name:             `${c.firstName} ${c.lastName}`,
        email:            c.email,
        amlStatus:        c.amlStatus,
        identityVerified: c.identityVerified,
        identityDocType:  c.identityDocType,
        identityDocExpiry:c.identityDocExpiry,
        sourceOfFunds:    c.sourceOfFunds,
        screeningRef:     c.amlScreeningRef,
        screeningDate:    c.amlScreeningDate,
        nextReview:       c.amlNextReview,
        pepStatus:        c.pepStatus,
        sanctionsClear:   c.sanctionsClear,
      })),
    });
  } catch (err) { next(err); }
};

// GET /api/compliance/audit
const getAuditLog = async (req, res, next) => {
  try {
    const { resource, userId, action, limit = 100 } = req.query;
    const filter = {};
    if (resource) filter.resource = resource;
    if (userId)   filter.userId   = userId;
    if (action)   filter.action   = action;

    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({ success: true, logs });
  } catch (err) { next(err); }
};

// GET /api/compliance/stats
const getComplianceStats = async (req, res, next) => {
  try {
    const today = new Date();
    const totalCases  = await Case.countDocuments({ status: { $in: ["open", "pending"] } });
    const overdue = await Case.countDocuments({
      status: { $in: ["open", "pending"] },
      nextSupervisionDate: { $lt: today },
    });
    const highAML    = await Client.countDocuments({ amlStatus: "high" });
    const mediumAML  = await Client.countDocuments({ amlStatus: "medium" });
    const unverified = await Client.countDocuments({ identityVerified: false });
    const pendingAML = await Client.countDocuments({ amlStatus: "pending" });

    res.json({ success: true, stats: { supervisionOverdue: overdue, highAML, mediumAML, unverified, pendingAML, totalActiveCases: totalCases } });
  } catch (err) { next(err); }
};

module.exports = { getSupervisionQueue, getAMLRegister, getAuditLog, getComplianceStats };
