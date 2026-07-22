const mongoose = require("mongoose");

const invoiceLineSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity:    { type: Number, default: 1 },
  unitPrice:   { type: Number, required: true },
  total:       { type: Number, required: true },
});

const paymentSchema = new mongoose.Schema({
  amount:      { type: Number, required: true },
  method:      { type: String, enum: ["bank_transfer", "card", "cheque", "cash", "other"], default: "bank_transfer" },
  reference:   { type: String },
  receivedAt:  { type: Date, default: Date.now },
  recordedBy:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  notes:       { type: String },
});

const invoiceSchema = new mongoose.Schema(
  {
    number:   { type: String, unique: true },   // INV-2026-0001
    caseId:   { type: mongoose.Schema.Types.ObjectId, ref: "Case", required: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
    createdBy:{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    lines:    [invoiceLineSchema],
    payments: [paymentSchema],

    subtotal:    { type: Number, default: 0 },
    vatAmount:   { type: Number, default: 0 },
    vatRate:     { type: Number, default: 0.20 },
    total:       { type: Number, default: 0 },
    paid:        { type: Number, default: 0 },
    outstanding: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["draft", "sent", "partial", "paid", "overdue", "cancelled"],
      default: "draft",
    },

    issuedAt:   { type: Date, default: Date.now },
    dueAt:      { type: Date },
    sentAt:     { type: Date },
    paidAt:     { type: Date },

    notes:      { type: String },
    paymentLink:{ type: String },
  },
  { timestamps: true }
);

// Auto-generate invoice number
invoiceSchema.pre("save", async function (next) {
  if (this.isNew && !this.number) {
    const year = new Date().getFullYear();
    const count = await mongoose.model("Invoice").countDocuments();
    this.number = `INV-${year}-${String(count + 1).padStart(4, "0")}`;
  }
  // Recalculate outstanding
  this.outstanding = Math.max(0, this.total - this.paid);
  if (this.outstanding === 0 && this.paid > 0) this.status = "paid";
  else if (this.paid > 0 && this.outstanding > 0) this.status = "partial";
  next();
});

invoiceSchema.index({ caseId: 1 });
invoiceSchema.index({ clientId: 1 });
invoiceSchema.index({ status: 1 });

module.exports = mongoose.model("Invoice", invoiceSchema);
