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

    const invoices = await Invoice.find(filter)
      .populate("caseId",   "reference type")
      .populate("clientId", "firstName lastName")
      .populate("createdBy","name")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      invoices: invoices.map((i) => ({
        id:          i._id,
        number:      i.number,
        caseId:      i.caseId?._id,
        caseRef:     i.caseId?.reference,
        clientId:    i.clientId?._id,
        clientName:  i.clientId ? `${i.clientId.firstName} ${i.clientId.lastName}` : "",
        subtotal:    i.subtotal,
        vatAmount:   i.vatAmount,
        total:       i.total,
        paid:        i.paid,
        outstanding: i.outstanding,
        status:      i.status,
        issuedAt:    i.issuedAt,
        dueAt:       i.dueAt,
      })),
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
    });

    // Update case outstanding
    await Case.findByIdAndUpdate(caseId, { $inc: { outstanding: total, billed: total } });
    await createAuditLog(req, "CREATE", "Invoice", invoice._id, `Invoice ${invoice.number} created: £${total}`);
    res.status(201).json({ success: true, invoice });
  } catch (err) { next(err); }
};

// POST /api/invoices/:id/payment
const recordPayment = async (req, res, next) => {
  try {
    const { amount, method, reference, notes } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ success: false, message: "Valid amount required" });

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });

    invoice.payments.push({ amount, method, reference, notes, recordedBy: req.user.userId });
    invoice.paid += amount;
    invoice.outstanding = Math.max(0, invoice.total - invoice.paid);
    if (invoice.outstanding === 0) { invoice.status = "paid"; invoice.paidAt = new Date(); }
    else invoice.status = "partial";
    await invoice.save();

    // Update case outstanding
    await Case.findByIdAndUpdate(invoice.caseId, { $inc: { outstanding: -amount, billed: amount } });
    await createAuditLog(req, "CREATE", "Payment", invoice._id, `Payment £${amount} recorded on ${invoice.number}`);
    res.json({ success: true, invoice });
  } catch (err) { next(err); }
};

// PATCH /api/invoices/:id/send
const markSent = async (req, res, next) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id, { status: "sent", sentAt: new Date() }, { new: true }
    );
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });
    res.json({ success: true, invoice });
  } catch (err) { next(err); }
};

module.exports = { getInvoices, createInvoice, recordPayment, markSent };
