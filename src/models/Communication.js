const mongoose = require("mongoose");

const communicationSchema = new mongoose.Schema(
  {
    matterId: { type: mongoose.Schema.Types.ObjectId, ref: "Matter", required: true },
    type: { type: String, enum: ["email", "call", "sms", "portal"], required: true },
    direction: { type: String, enum: ["inbound", "outbound"], required: true },
    sender: { type: String, required: true },
    recipient: { type: String, required: true },
    subject: { type: String },
    body: { type: String, required: true }, // Immutable original body
    attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Document" }],
    // Corrections or updates appended via addendum
    addendum: [{
      text: { type: String, required: true },
      addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      addedAt: { type: Date, default: Date.now }
    }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

communicationSchema.index({ matterId: 1 });
communicationSchema.index({ type: 1 });

module.exports = mongoose.model("Communication", communicationSchema);
