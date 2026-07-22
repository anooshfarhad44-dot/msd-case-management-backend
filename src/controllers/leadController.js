const Lead = require("../models/Lead");
const { createAuditLog } = require("../utils/audit");

// GET /api/leads
const getLeads = async (req, res, next) => {
  try {
    const { status, assignedTo } = req.query;
    const filter = {};

    if (req.user.role === "sales") filter.assignedTo = req.user.userId;
    else if (assignedTo && assignedTo !== "all") filter.assignedTo = assignedTo;
    if (status && status !== "all") filter.status = status;

    const leads = await Lead.find(filter)
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      leads: leads.map((l) => ({
        id:               l._id,
        name:             `${l.firstName} ${l.lastName}`,
        firstName:        l.firstName,
        lastName:         l.lastName,
        email:            l.email,
        phone:            l.phone,
        type:             l.type,
        source:           l.source,
        status:           l.status,
        assignedTo:       l.assignedTo?._id,
        assignedToName:   l.assignedTo?.name || "",
        consultationDate: l.consultationDate,
        estimatedFee:     l.estimatedFee,
        notes:            l.notes,
        createdAt:        l.createdAt,
      })),
    });
  } catch (err) { next(err); }
};

// POST /api/leads
const createLead = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, type, source, notes, estimatedFee } = req.body;
    if (!firstName || !lastName || !type) {
      return res.status(400).json({ success: false, message: "firstName, lastName and type are required" });
    }
    const lead = await Lead.create({
      firstName, lastName, email, phone, type, source, notes, estimatedFee,
      assignedTo: req.user.userId,
      createdBy:  req.user.userId,
    });
    await createAuditLog(req, "CREATE", "Lead", lead._id, `New lead: ${firstName} ${lastName} — ${type}`);
    res.status(201).json({ success: true, lead });
  } catch (err) { next(err); }
};

// PATCH /api/leads/:id
const updateLead = async (req, res, next) => {
  try {
    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!lead) return res.status(404).json({ success: false, message: "Lead not found" });
    await createAuditLog(req, "UPDATE", "Lead", lead._id, `Lead updated: ${lead.firstName} ${lead.lastName} → ${lead.status}`);
    res.json({ success: true, lead });
  } catch (err) { next(err); }
};

// POST /api/leads/:id/convert
// Converts an instructed lead into a Client record
const convertLead = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: "Lead not found" });
    if (lead.convertedToClientId) {
      return res.status(409).json({ success: false, message: "This lead has already been converted to a client" });
    }

    const Client = require("../models/Client");

    // Check if client with same email already exists
    if (lead.email) {
      const existing = await Client.findOne({ email: lead.email.toLowerCase() });
      if (existing) {
        // Link lead to existing client instead of creating duplicate
        lead.convertedToClientId = existing._id;
        lead.convertedAt = new Date();
        lead.status = "instructed";
        await lead.save();
        return res.json({ success: true, client: existing, alreadyExisted: true });
      }
    }

    // Create new client from lead data
    const client = await Client.create({
      firstName:   lead.firstName,
      lastName:    lead.lastName,
      email:       lead.email,
      phone:       lead.phone,
      createdBy:   req.user.userId,
      amlStatus:   "pending",
      portalActive: false,
      referralSource: lead.source,
      notes:       lead.notes,
    });

    // Update lead as converted
    lead.convertedToClientId = client._id;
    lead.convertedAt = new Date();
    lead.status = "instructed";
    await lead.save();

    await createAuditLog(req, "CREATE", "Client", client._id, `Converted from lead: ${lead.firstName} ${lead.lastName}`);
    res.status(201).json({ success: true, client, alreadyExisted: false });
  } catch (err) { next(err); }
};

module.exports = { getLeads, createLead, updateLead, convertLead };
