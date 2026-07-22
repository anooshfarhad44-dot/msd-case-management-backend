const MatterParty = require("../models/MatterParty");
const { createAuditLog } = require("../utils/audit");

// GET /api/cases/:caseId/parties
const getParties = async (req, res, next) => {
  try {
    const parties = await MatterParty.find({ caseId: req.params.caseId })
      .populate("addedBy", "name")
      .sort({ createdAt: 1 });
    res.json({ success: true, parties });
  } catch (err) { next(err); }
};

// POST /api/cases/:caseId/parties
const addParty = async (req, res, next) => {
  try {
    const { role, name, email, phone, organisation, notes } = req.body;
    if (!role || !name) {
      return res.status(400).json({ success: false, message: "role and name are required" });
    }
    const party = await MatterParty.create({
      caseId: req.params.caseId,
      role, name, email, phone, organisation, notes,
      addedBy: req.user.userId,
    });
    await createAuditLog(req, "CREATE", "MatterParty", party._id, `Added party: ${name} (${role})`);
    res.status(201).json({ success: true, party });
  } catch (err) { next(err); }
};

// PATCH /api/cases/:caseId/parties/:partyId
const updateParty = async (req, res, next) => {
  try {
    const party = await MatterParty.findOneAndUpdate(
      { _id: req.params.partyId, caseId: req.params.caseId },
      req.body,
      { new: true }
    );
    if (!party) return res.status(404).json({ success: false, message: "Party not found" });
    res.json({ success: true, party });
  } catch (err) { next(err); }
};

// DELETE /api/cases/:caseId/parties/:partyId
const removeParty = async (req, res, next) => {
  try {
    await MatterParty.findOneAndDelete({ _id: req.params.partyId, caseId: req.params.caseId });
    await createAuditLog(req, "DELETE", "MatterParty", req.params.partyId, "Party removed");
    res.json({ success: true });
  } catch (err) { next(err); }
};

module.exports = { getParties, addParty, updateParty, removeParty };
