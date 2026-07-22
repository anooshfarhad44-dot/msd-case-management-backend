const mongoose = require("mongoose");

const timeEntrySchema = new mongoose.Schema(
  {
    matterId: { type: mongoose.Schema.Types.ObjectId, ref: "Matter", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true, default: Date.now },
    duration: { type: Number, required: true }, // in minutes
    category: { type: String, required: true, default: "General" }, // e.g., Drafting, Meeting, Court
    hourlyRate: { type: Number, required: true, default: 0 },
    totalAmount: { type: Number, required: true, default: 0 },
    narrative: { type: String, required: true },
    status: { type: String, enum: ["unbilled", "billed", "locked"], default: "unbilled" },
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice" },
  },
  { timestamps: true }
);

timeEntrySchema.index({ matterId: 1 });
timeEntrySchema.index({ userId: 1 });
timeEntrySchema.index({ status: 1 });

// Pre-save to auto-calculate total amount based on duration and rate
timeEntrySchema.pre("save", function (next) {
  if (this.duration && this.hourlyRate) {
    this.totalAmount = (this.duration / 60) * this.hourlyRate;
  }
  next();
});

module.exports = mongoose.model("TimeEntry", timeEntrySchema);
