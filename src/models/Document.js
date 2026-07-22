const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["identity", "financial", "supporting", "application", "compliance", "court_bundle", "correspondence", "generated"],
      required: true,
    },

    // ── Relationships ─────────────────────────────────────────────────────────
    caseId:    { type: mongoose.Schema.Types.ObjectId, ref: "Case" },
    clientId:  { type: mongoose.Schema.Types.ObjectId, ref: "Client" },
    uploadedBy:{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // ── File info ─────────────────────────────────────────────────────────────
    originalName: { type: String },
    mimeType:     { type: String },
    size:         { type: Number },  // bytes
    sizeLabel:    { type: String },  // "1.2 MB"
    storagePath:  { type: String },  // local path or S3 key
    storageType:  { type: String, enum: ["local", "s3"], default: "local" },

    // ── Versioning ────────────────────────────────────────────────────────────
    version:    { type: Number, default: 1 },
    isLatest:   { type: Boolean, default: true },
    previousVersionId: { type: mongoose.Schema.Types.ObjectId, ref: "Document" },

    // ── Generated documents ───────────────────────────────────────────────────
    isGenerated:    { type: Boolean, default: false },
    templateUsed:   { type: String },  // e.g. "client_care_letter"
    generatedData:  { type: mongoose.Schema.Types.Mixed },

    // ── Status ────────────────────────────────────────────────────────────────
    status: { type: String, enum: ["active", "archived", "deleted"], default: "active" },
    tags:   [{ type: String }],
    notes:  { type: String },
  },
  { timestamps: true }
);

documentSchema.index({ caseId: 1 });
documentSchema.index({ clientId: 1 });
documentSchema.index({ category: 1 });

module.exports = mongoose.model("Document", documentSchema);
