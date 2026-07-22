const Invoice = require("../models/Invoice");
const Case    = require("../models/Case");
const { createAuditLog } = require("../utils/audit");

// GET /api/invoices
const getInvoices = async (req, res, next) => {
  try {
    const { status, caseId, clientId } = req.query;
    const filter = {};
    if (status   && status !== "all") filter.status   = status;
    if (caseId)                        filter.caseId   = caseId;
    if (clientId)                      filter.clientId = clientId;

    // Role-scoped: caseworkers see limited fields
    const isCaseworker = ["fee_earner","paralegal"].includes(req.user.role);

    const invoices = await Invoice.find(filter)
      .populate("caseId",   "reference type")
      .populate("clientId", "firstName lastName")
      .populate("createdBy","name")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      invoices: invoices.map((i) => {
        const base = {
          id:          i._id,
          number:      i.number,
          caseId:      i.caseId?._id,
          caseRef:     i.caseId?.reference,
          clientId:    i.clientId?._id,
          clientName:  i.clientId ? `${i.clientId.firstName} ${i.clientId.lastName}` : "",
          total:       i.total,
          outstanding: i.outstanding,
          status:      i.status,
          issuedAt:    i.issuedAt,
          dueAt:       i.dueAt,
          approvedAt:  i.approvedAt,
          approvedBy:  i.approvedBy,
          pendingApproval: i.pendingApproval,
        };
        // Caseworkers only see what they need for case conduct
        if (isCaseworker) return { id: base.id, caseRef: base.caseRef, total: base.total, status: base.status, outstanding: base.outstanding };
        return { ...base, subtotal: i.subtotal, vatAmount: i.vatAmount, paid: i.paid };
      }),
    });
  } catch (err) { next(err); }
};

// POST /api/invoices
const createInvoice = async (req, res, next) => {
  try {
    const { caseId, clientId, lines, dueAt, notes, vatRate = 0 } = req.body;
    if (!caseId || !clientId || !lines?.length) {
      return res.status(400).json({ success: false, message: "caseId, clientId and lines are required" });
    }
    const subtotal  = lines.reduce((s, l) => s + l.total, 0);
    const vatAmount = subtotal * vatRate;
    const total     = subtotal + vatAmount;

    const invoice = await Invoice.create({
      caseId, clientId, lines, dueAt, notes, vatRate,
      subtotal, vatAmount, total, outstanding: total,
      createdBy: req.user.userId,
      pendingApproval: true,  // requires dual approval before sending
    });

    await Case.findByIdAndUpdate(caseId, { $inc: { outstanding: total, billed: total } });
    await createAuditLog(req, "CREATE", "Invoice", invoice._id, `Invoice ${invoice.number} created (pending approval): £${total}`);
    res.status(201).json({ success: true, invoice });
  } catch (err) { next(err); }
};

// POST /api/invoices/:id/approve  — dual approval by finance_manager or director
const approveInvoice = async (req, res, next) => {
  try {
    if (!["finance_manager","director","admin"].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Only finance managers or directors can approve invoices" });
    }
    const invoice = await Invoice.findById(req.params.id).populate("createdBy", "_id");
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });
    if (invoice.createdBy?._id?.toString() === req.user.userId) {
      return res.status(403).json({ success: false, message: "The creator cannot approve their own invoice (dual-approval required)" });
    }
    if (!invoice.pendingApproval) return res.status(400).json({ success: false, message: "Invoice already approved" });

    invoice.pendingApproval = false;
    invoice.approvedBy = req.user.userId;
    invoice.approvedAt = new Date();
    await invoice.save();

    await createAuditLog(req, "UPDATE", "Invoice", invoice._id, `Invoice ${invoice.number} approved by ${req.user.name || req.user.userId}`);
    res.json({ success: true, invoice });
  } catch (err) { next(err); }
};

// POST /api/invoices/:id/payment
const recordPayment = async (req, res, next) => {
  try {
    const { amount, method, reference, notes } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ success: false, message: "Valid amount required" });

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });
    if (invoice.pendingApproval) return res.status(400).json({ success: false, message: "Invoice must be approved before recording payments" });

    invoice.payments.push({ amount, method, reference, notes, recordedBy: req.user.userId });
    invoice.paid += amount;
    invoice.outstanding = Math.max(0, invoice.total - invoice.paid);
    if (invoice.outstanding === 0) { invoice.status = "paid"; invoice.paidAt = new Date(); }
    else invoice.status = "partial";
    await invoice.save();

    await Case.findByIdAndUpdate(invoice.caseId, { $inc: { outstanding: -amount, billed: amount } });
    await createAuditLog(req, "CREATE", "Payment", invoice._id, `Payment £${amount} recorded on ${invoice.number}`);
    res.json({ success: true, invoice });
  } catch (err) { next(err); }
};

// PATCH /api/invoices/:id/send
const markSent = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });
    if (invoice.pendingApproval) return res.status(400).json({ success: false, message: "Invoice must be approved before sending" });

    invoice.status = "sent";
    invoice.sentAt = new Date();
    await invoice.save();
    res.json({ success: true, invoice });
  } catch (err) { next(err); }
};

module.exports = { getInvoices, createInvoice, approveInvoice, recordPayment, markSent };

