const mongoose = require("mongoose");

const noteVersionSchema = new mongoose.Schema({
  body:      { type: String, required: true },
  editedBy:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  editedAt:  { type: Date, default: Date.now },
});

const noteSchema = new mongoose.Schema({
  title:    { type: String, trim: true, default: "Untitled Note" },
  body:     { type: String, required: true },
  matterId: { type: mongoose.Schema.Types.ObjectId, ref: "Matter", required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // Access control
  accessLevel: {
    type: String,
    enum: ["all", "supervisor_only", "compliance_only"],
    default: "all",
  },

  // Locking
  locked:    { type: Boolean, default: false },
  lockedAt:  { type: Date },
  lockedBy:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  // Sign-off
  signedOff:   { type: Boolean, default: false },
  signOffBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  signOffAt:   { type: Date },

  // Version history (saved before each edit)
  versions: [noteVersionSchema],

  // Linked entities
  linkedTaskId:      { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  linkedTimeEntryId: { type: mongoose.Schema.Types.ObjectId },
}, { timestamps: true });

noteSchema.index({ matterId: 1, createdAt: -1 });

module.exports = mongoose.model("Note", noteSchema);
