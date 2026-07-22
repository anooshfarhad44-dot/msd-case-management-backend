const Communication = require("../models/Communication");
const Matter = require("../models/Matter");
const { createAuditLog } = require("../utils/audit");

// GET /api/matters/:id/communications
exports.getCommunications = async (req, res, next) => {
  try {
    const communications = await Communication.find({ matterId: req.params.id })
      .populate("createdBy", "name")
      .populate("attachments", "filename")
      .populate("addendum.addedBy", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, communications });
  } catch (err) {
    next(err);
  }
};

// POST /api/matters/:id/communications
exports.createCommunication = async (req, res, next) => {
  try {
    const { type, direction, sender, recipient, subject, body, attachments } = req.body;
    
    if (!type || !direction || !sender || !recipient || !body) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const matter = await Matter.findById(req.params.id);
    if (!matter) return res.status(404).json({ success: false, message: "Matter not found" });

    const communication = await Communication.create({
      matterId: matter._id,
      type, direction, sender, recipient, subject, body, attachments,
      createdBy: req.user._id
    });

    await matter.addTimelineEvent(
      "communication",
      `Logged ${direction} ${type} with ${direction === 'inbound' ? sender : recipient}`,
      { communicationId: communication._id },
      req.user._id,
      true // isAudit
    );

    res.status(201).json({ success: true, communication });
  } catch (err) {
    next(err);
  }
};

// POST /api/communications/:id/addendum
exports.addAddendum = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: "Addendum text is required" });

    const comm = await Communication.findById(req.params.id);
    if (!comm) return res.status(404).json({ success: false, message: "Communication not found" });

    comm.addendum.push({
      text,
      addedBy: req.user._id,
      addedAt: new Date()
    });
    
    await comm.save();
    
    const matter = await Matter.findById(comm.matterId);
    if (matter) {
      await matter.addTimelineEvent("communication", `Added addendum to ${comm.type}`, { communicationId: comm._id }, req.user._id, true);
    }

    res.json({ success: true, communication: comm });
  } catch (err) {
    next(err);
  }
};
