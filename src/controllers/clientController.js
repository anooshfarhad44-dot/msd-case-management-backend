const Client = require("../models/Client");
const Case   = require("../models/Case");
const { createAuditLog } = require("../utils/audit");

// GET /api/clients
const getClients = async (req, res, next) => {
  try {
    const { search, amlStatus, page = 1, limit = 50 } = req.query;
    const filter = { isActive: true };

    if (amlStatus && amlStatus !== "all") filter.amlStatus = amlStatus;
    if (search) {
      filter.$or = [
        { firstName:   { $regex: search, $options: "i" } },
        { lastName:    { $regex: search, $options: "i" } },
        { email:       { $regex: search, $options: "i" } },
        { nationality: { $regex: search, $options: "i" } },
      ];
    }

    const clients = await Client.find(filter)
      .sort({ lastName: 1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Client.countDocuments(filter);

    // Attach case counts
    const clientIds = clients.map((c) => c._id);
    const caseCounts = await Case.aggregate([
      { $match: { clientId: { $in: clientIds } } },
      { $group: { _id: "$clientId", total: { $sum: 1 }, open: { $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] } } } },
    ]);
    const countMap = {};
    caseCounts.forEach((c) => { countMap[c._id.toString()] = c; });

    res.json({
      success: true,
      total,
      page: Number(page),
      clients: clients.map((c) => {
        const cc = countMap[c._id.toString()] || { total: 0, open: 0 };
        return {
          id:               c._id,
          name:             `${c.firstName} ${c.lastName}`,
          firstName:        c.firstName,
          lastName:         c.lastName,
          email:            c.email,
          phone:            c.phone,
          nationality:      c.nationality,
          dob:              c.dateOfBirth,
          address:          c.address,
          amlStatus:        c.amlStatus,
          identityVerified: c.identityVerified,
          portalActive:     c.portalActive,
          marketingConsent: c.marketingConsent,
          totalCases:       cc.total,
          openCases:        cc.open,
          createdAt:        c.createdAt,
        };
      }),
    });
  } catch (err) { next(err); }
};

// GET /api/clients/:id
const getClientById = async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ success: false, message: "Client not found" });
    const cases = await Case.find({ clientId: client._id }).select("reference type status fee outstanding keyDate");
    res.json({ success: true, client, cases });
  } catch (err) { next(err); }
};

// POST /api/clients
const createClient = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, dateOfBirth, nationality, address } = req.body;
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ success: false, message: "First name, last name and email are required" });
    }
    const existing = await Client.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ success: false, message: "Client with this email already exists" });

    const client = await Client.create({ firstName, lastName, email, phone, dateOfBirth, nationality, address, createdBy: req.user.userId });
    await createAuditLog(req, "CREATE", "Client", client._id, `Created client: ${firstName} ${lastName}`);
    res.status(201).json({ success: true, client });
  } catch (err) { next(err); }
};

// PATCH /api/clients/:id
const updateClient = async (req, res, next) => {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!client) return res.status(404).json({ success: false, message: "Client not found" });
    await createAuditLog(req, "UPDATE", "Client", client._id, `Updated client: ${client.firstName} ${client.lastName}`);
    res.json({ success: true, client });
  } catch (err) { next(err); }
};

// PATCH /api/clients/:id/aml
const updateAML = async (req, res, next) => {
  try {
    const { amlStatus, identityVerified, identityDocType, identityDocExpiry, sourceOfFunds, amlScreeningRef, amlNextReview } = req.body;
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      { amlStatus, identityVerified, identityDocType, identityDocExpiry, sourceOfFunds, amlScreeningRef, amlScreeningDate: new Date(), amlNextReview },
      { new: true }
    );
    if (!client) return res.status(404).json({ success: false, message: "Client not found" });
    await createAuditLog(req, "UPDATE", "Client", client._id, `AML updated to: ${amlStatus}`);
    res.json({ success: true, client });
  } catch (err) { next(err); }
};

module.exports = { getClients, getClientById, createClient, updateClient, updateAML };
