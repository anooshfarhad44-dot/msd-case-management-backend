const mongoose = require("mongoose");

/**
 * Matter — the top-level container for all legal work for a client
 * A Matter can contain multiple Cases/Files
 * e.g. Client "Amina Rahim" has Matter "Immigration" which contains:
 *   - Case 1: Spouse Visa LTR
 *   - Case 2: FLR(M) renewal
 */

const checklistItemSchema = new mongoose.Schema({
  code:         { type: String, trim: true },
  label:        { type: String, required: true },
  required:     { type: Boolean, default: false },
  completed:    { type: Boolean, default: false },
  completedBy:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  completedAt:  { type: Date },
  naReason:     { type: String },   // reason if marked N/A
  notes:        { type: String },
});

const matterPartySchema = new mongoose.Schema({
  role:         { type: String, enum: ["client","opponent","dependant","child","barrister","interpreter","employer","agent","court","authority","witness","expert","other"], required: true },
  name:         { type: String, required: true, trim: true },
  email:        { type: String, trim: true, lowercase: true },
  phone:        { type: String, trim: true },
  organisation: { type: String, trim: true },
  isProtected:  { type: Boolean, default: false },  // protected address — masked
  notes:        { type: String, trim: true },
  startDate:    { type: Date },
  endDate:      { type: Date },
  addedBy:      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  addedAt:      { type: Date, default: Date.now },
  // Role history — versioned record of all role changes
  roleHistory: [{
    previousRole: { type: String },
    changedTo:    { type: String },
    changedBy:    { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    changedAt:    { type: Date, default: Date.now },
  }],
});

const timelineEventSchema = new mongoose.Schema({
  type:        { type: String, enum: ["created","stage_change","note","document","task","supervision","communication","billing","compliance","audit","closed","reopened"], required: true },
  description: { type: String, required: true },
  data:        { type: mongoose.Schema.Types.Mixed },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt:   { type: Date, default: Date.now },
  isAudit:     { type: Boolean, default: false },  // immutable audit events
});

const matterSchema = new mongoose.Schema(
  {
    // ── Reference ──────────────────────────────────────────────────────────
    reference: { type: String, unique: true, trim: true },  // auto-generated

    // ── Client ─────────────────────────────────────────────────────────────
    clientId:  { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },

    // ── Practice area ───────────────────────────────────────────────────────
    practiceArea: {
      type: String,
      enum: ["immigration", "family", "employment", "property", "corporate", "criminal", "other"],
      required: true,
    },
    matterType: { type: String, required: true, trim: true },  // e.g. "Spouse Visa LTR"
    description:{ type: String, trim: true },

    // ── Team ────────────────────────────────────────────────────────────────
    ownerId:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    supervisorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // ── Status & Stage ──────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["active","pending","on_hold","closed","archived"],
      default: "active",
    },
    stage: { type: String, trim: true, default: "Initial Assessment" },

    // ── Jurisdiction & Classification ────────────────────────────────────────
    jurisdiction: { type: String, trim: true },
    classification: { type: String, enum: ["confidential","internal","public"], default: "internal" },

    // ── Risk ────────────────────────────────────────────────────────────────
    risk:     { type: String, enum: ["low","medium","high","critical"], default: "low" },
    priority: { type: String, enum: ["normal","urgent","critical"], default: "normal" },

    // ── Funding ─────────────────────────────────────────────────────────────
    fundingType: {
      type: String,
      enum: ["fixed_fee","hourly","legal_aid","conditional","pro_bono","other"],
      default: "fixed_fee",
    },
    fixedFee:    { type: Number, default: 0 },
    hourlyRate:  { type: Number, default: 0 },

    // ── Financial ───────────────────────────────────────────────────────────
    totalBilled:  { type: Number, default: 0 },
    totalPaid:    { type: Number, default: 0 },
    outstanding:  { type: Number, default: 0 },
    wip:          { type: Number, default: 0 },  // work in progress

    // ── Key dates ───────────────────────────────────────────────────────────
    openedAt:       { type: Date, default: Date.now },
    closedAt:       { type: Date },
    keyDate:        { type: Date },
    nextActionDate: { type: Date },
    nextActionNote: { type: String },

    // ── Immigration-specific ────────────────────────────────────────────────
    immigration: {
      applicationRoute:  { type: String },  // e.g. "Appendix FM", "PBS Tier 2"
      applicationLocation: { type: String, enum: ["inside_uk","outside_uk","both"] },
      visaExpiryDate:    { type: Date },
      leaveExpiryDate:   { type: Date },
      homeOfficeRef:     { type: String },
      sponsorName:       { type: String },
      sponsorRef:        { type: String },
      routeSpecificFields: { type: mongoose.Schema.Types.Mixed },
      legalCalculation: {
        source:          { type: String },
        assumptions:     { type: String },
        reviewer:        { type: String },
      },
      authorisedSignOff: {
        signedBy:        { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        signedAt:        { type: Date },
        notes:           { type: String },
      },
      hasDependants:     { type: Boolean, default: false },
      dependants:        [{ name: String, dob: Date, relation: String }],
      isUrgent:          { type: Boolean, default: false },  // near-expiry alert
    },

    // ── Family-specific ─────────────────────────────────────────────────────
    family: {
      caseType:          { type: String },  // e.g. "Child Arrangements", "Divorce"
      courtName:         { type: String },
      courtRef:          { type: String },
      hasChildren:       { type: Boolean, default: false },
      childrenCount:     { type: Number },
      nextHearingDate:   { type: Date },
      hasDomesticAbuse:  { type: Boolean, default: false },  // safeguarding flag
      hasChildRisk:      { type: Boolean, default: false },
      protectedAddress:  { type: Boolean, default: false },  // mask address
      isWithoutNotice:   { type: Boolean, default: false },  // urgent/without-notice
      shortenedApprovalReason: { type: String },
      retrospectiveReviewRequired: { type: Boolean, default: false },
      retrospectiveReviewCompletedAt: { type: Date },
      retrospectiveReviewCompletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },

    // ── Compliance ──────────────────────────────────────────────────────────
    conflictCheckDone:   { type: Boolean, default: false },
    conflictCheckNotes:  { type: String },
    cddComplete:         { type: Boolean, default: false },
    supervisionCadence:  { type: String, enum: ["monthly","6weekly","quarterly","none"], default: "monthly" },
    lastSupervisionDate: { type: Date },
    nextSupervisionDate: { type: Date },

    // ── Opening gates ────────────────────────────────────────────────────────
    openingGates: {
      conflictPassed:    { type: Boolean, default: false },
      amlPassed:         { type: Boolean, default: false },
      engagementSigned:  { type: Boolean, default: false },
      fundingAgreed:     { type: Boolean, default: false },
      exceptionReason:   { type: String },  // if gates bypassed
      exceptionBy:       { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },

    // ── Closure ──────────────────────────────────────────────────────────────
    closure: {
      outcome:           { type: String, enum: ["successful","unsuccessful","withdrawn","settled","other"] },
      outcomeNotes:      { type: String },
      closedBy:          { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      checklistComplete: { type: Boolean, default: false },
      clientFeedback:    { type: String },
    },

    // ── Parties ──────────────────────────────────────────────────────────────
    parties:   [matterPartySchema],

    // ── Checklist ────────────────────────────────────────────────────────────
    checklist: [checklistItemSchema],

    // ── Timeline (append-only) ────────────────────────────────────────────────
    timeline:  [timelineEventSchema],

    // ── Documents ─────────────────────────────────────────────────────────────
    documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],

    // ── Tags ──────────────────────────────────────────────────────────────────
    tags: [{ type: String }],

    // ── Restricted access ─────────────────────────────────────────────────────
    isRestricted:      { type: Boolean, default: false },
    restrictedRoles:   [{ type: String }],

    // ── Template ──────────────────────────────────────────────────────────────
    createdFromTemplate: { type: String },
  },
  { timestamps: true }
);

// ── Auto-generate reference ──────────────────────────────────────────────────
matterSchema.pre("save", async function (next) {
  if (this.isNew && !this.reference) {
    const year  = new Date().getFullYear().toString().slice(-2);
    const month = String(new Date().getMonth() + 1).padStart(2, "0");
    const seq   = Math.floor(1000 + Math.random() * 8999);
    const area  = (this.practiceArea || "gen").slice(0, 3).toUpperCase();
    this.reference = `M.${month}${year}.${seq}.${area}`;
  }
  // Immigration near-expiry alert
  if (this.immigration?.leaveExpiryDate) {
    const daysLeft = Math.ceil((new Date(this.immigration.leaveExpiryDate) - new Date()) / 86400000);
    this.immigration.isUrgent = daysLeft <= 90;
  }
  next();
});

// ── Add timeline event helper ────────────────────────────────────────────────
matterSchema.methods.addTimelineEvent = async function (type, description, data, userId, isAudit = false) {
  this.timeline.push({ type, description, data, createdBy: userId, isAudit });
  await this.save();
};

// ── Indexes ──────────────────────────────────────────────────────────────────
matterSchema.index({ clientId: 1 });
matterSchema.index({ ownerId: 1 });
matterSchema.index({ status: 1 });
matterSchema.index({ practiceArea: 1 });
matterSchema.index({ "immigration.leaveExpiryDate": 1 });

module.exports = mongoose.model("Matter", matterSchema);
