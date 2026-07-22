const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    // ── Identity ──────────────────────────────────────────────────────────────
    firstName:   { type: String, required: true, trim: true },
    lastName:    { type: String, required: true, trim: true },
    email:       { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone:       { type: String, trim: true },
    dateOfBirth: { type: Date },
    nationality: { type: String, trim: true },
    address: {
      line1:    { type: String, trim: true },
      line2:    { type: String, trim: true },
      city:     { type: String, trim: true },
      postcode: { type: String, trim: true },
      country:  { type: String, trim: true, default: "United Kingdom" },
    },

    // ── AML / CDD ─────────────────────────────────────────────────────────────
    amlStatus:        { type: String, enum: ["pending", "clear", "medium", "high"], default: "pending" },
    identityVerified: { type: Boolean, default: false },
    identityDocType:  { type: String, enum: ["passport", "driving_licence", "national_id", "other"], },
    identityDocExpiry:{ type: Date },
    sourceOfFunds:    { type: String, trim: true },
    amlScreeningRef:  { type: String, trim: true },
    amlScreeningDate: { type: Date },
    amlNextReview:    { type: Date },
    pepStatus:        { type: Boolean, default: false },   // Politically Exposed Person
    sanctionsClear:   { type: Boolean, default: true },

    // ── Portal ────────────────────────────────────────────────────────────────
    portalActive:      { type: Boolean, default: false },
    portalLastLogin:   { type: Date },
    marketingConsent:  { type: Boolean, default: false },

    // ── Meta ──────────────────────────────────────────────────────────────────
    referralSource:  { type: String, trim: true },
    notes:           { type: String, trim: true },
    createdBy:       { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isActive:        { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Virtual: full name
clientSchema.virtual("name").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Indexes — email already indexed via unique:true in schema, skip duplicate
clientSchema.index({ lastName: 1, firstName: 1 });
clientSchema.index({ amlStatus: 1 });

module.exports = mongoose.model("Client", clientSchema);
