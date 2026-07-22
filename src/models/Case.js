const mongoose = require("mongoose");

// Auto-generate case reference: e.g. SF.0726.3512.SV-LTR
function generateReference(initials, type) {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = String(now.getFullYear()).slice(-2);
  const seq = Math.floor(3000 + Math.random() * 1999);
  const typeCode = (type || "GEN").replace(/\s+/g, "-").toUpperCase().slice(0, 8);
  return `${(initials || "XX").toUpperCase()}.${mm}${yy}.${seq}.${typeCode}`;
}

const noteSchema = new mongoose.Schema({
  text:      { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
  isPrivate: { type: Boolean, default: false },
});

const supervisionSchema = new mongoose.Schema({
  recordedBy:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  findings:    { type: String },
  actionItems: { type: String },
  nextDueDate: { type: Date },
  recordedAt:  { type: Date, default: Date.now },
});

const caseSchema = new mongoose.Schema(
  {
    // ── Reference ─────────────────────────────────────────────────────────────
    reference: { type: String, unique: true, trim: true },

    // ── Relationships ─────────────────────────────────────────────────────────
    clientId:     { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
    assignedTo:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    supervisedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // ── Matter details ────────────────────────────────────────────────────────
    type:        { type: String, required: true, trim: true },
    subType:     { type: String, trim: true },
    description: { type: String, trim: true },
    stage:       { type: String, trim: true, default: "Initial Assessment" },

    status: {
      type: String,
      enum: ["open", "pending", "awaiting_decision", "on_hold", "closed", "archived"],
      default: "open",
    },
    priority: { type: String, enum: ["normal", "urgent", "critical"], default: "normal" },
    risk:     { type: String, enum: ["low", "medium", "high"], default: "low" },

    // ── Key dates ─────────────────────────────────────────────────────────────
    openedAt:     { type: Date, default: Date.now },
    closedAt:     { type: Date },
    keyDate:      { type: Date },
    hearingDate:  { type: Date },
    deadlineDate: { type: Date },

    // ── Financial ─────────────────────────────────────────────────────────────
    fee:             { type: Number, default: 0 },
    disbursements:   { type: Number, default: 0 },
    vatRate:         { type: Number, default: 0.20 },
    billed:          { type: Number, default: 0 },
    outstanding:     { type: Number, default: 0 },
    billingType:     { type: String, enum: ["fixed", "hourly", "legal_aid"], default: "fixed" },

    // ── Compliance ────────────────────────────────────────────────────────────
    conflictCheckDone:   { type: Boolean, default: false },
    conflictCheckNotes:  { type: String },
    cddComplete:         { type: Boolean, default: false },
    supervisionCadence:  { type: String, enum: ["monthly", "6weekly", "quarterly", "none"], default: "monthly" },
    lastSupervisionDate: { type: Date },
    nextSupervisionDate: { type: Date },
    supervisionRecords:  [supervisionSchema],

    // ── Tags & notes ──────────────────────────────────────────────────────────
    tags:  [{ type: String }],
    notes: [noteSchema],

    // ── Workflow ──────────────────────────────────────────────────────────────
    workflowTemplate: { type: String },
    currentWorkflowStep: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Auto-generate reference before save
caseSchema.pre("save", async function (next) {
  if (this.isNew && !this.reference) {
    // Will be set by controller with user initials
    this.reference = generateReference("XX", this.type);
  }
  next();
});

// Indexes
caseSchema.index({ clientId: 1 });
caseSchema.index({ assignedTo: 1 });
caseSchema.index({ clientId: 1 });
caseSchema.index({ assignedTo: 1 });
caseSchema.index({ status: 1 });
// reference already unique:true in schema — no duplicate index needed
caseSchema.index({ keyDate: 1 });

module.exports = mongoose.model("Case", caseSchema);
module.exports.generateReference = generateReference;
