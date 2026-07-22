const mongoose = require("mongoose");

// Matter parties — people involved in a case other than the main client
// e.g. sponsor, barrister, solicitor agent, interpreter, employer, etc.
const matterPartySchema = new mongoose.Schema(
  {
    caseId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "Case",
      required: true,
    },
    role: {
      type: String,
      enum: [
        "sponsor",         // e.g. spouse in spouse visa
        "barrister",
        "interpreter",
        "employer",
        "agent",
        "applicant",       // if different from main client
        "witness",
        "expert",
        "other",
      ],
      required: true,
    },
    name:         { type: String, required: true, trim: true },
    email:        { type: String, trim: true, lowercase: true },
    phone:        { type: String, trim: true },
    organisation: { type: String, trim: true },
    notes:        { type: String, trim: true },
    addedBy:      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

matterPartySchema.index({ caseId: 1 });

module.exports = mongoose.model("MatterParty", matterPartySchema);
