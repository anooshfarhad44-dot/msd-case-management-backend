const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
    // ── Contact ───────────────────────────────────────────────────────────────
    firstName:   { type: String, required: true, trim: true },
    lastName:    { type: String, required: true, trim: true },
    email:       { type: String, lowercase: true, trim: true },
    phone:       { type: String, trim: true },

    // ── Matter ────────────────────────────────────────────────────────────────
    type:        { type: String, required: true, trim: true },  // e.g. "Spouse Visa"
    description: { type: String, trim: true },
    source:      {
      type: String,
      enum: ["website", "referral", "walk_in", "phone", "email", "social_media", "other"],
      default: "website",
    },

    // ── Pipeline ──────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["new", "contacted", "consultation", "instructed", "lost", "duplicate"],
      default: "new",
    },
    assignedTo:       { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdBy:        { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    consultationDate: { type: Date },
    instructedDate:   { type: Date },
    lostReason:       { type: String },

    estimatedFee:     { type: Number },
    notes:            { type: String },

    // ── Conversion ────────────────────────────────────────────────────────────
    convertedToClientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client" },
    convertedToCaseId:   { type: mongoose.Schema.Types.ObjectId, ref: "Case" },
    convertedAt:         { type: Date },
  },
  { timestamps: true }
);

leadSchema.virtual("name").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

leadSchema.index({ status: 1 });
leadSchema.index({ assignedTo: 1 });

module.exports = mongoose.model("Lead", leadSchema);
