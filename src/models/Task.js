const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, trim: true },

    // ── Relationships ─────────────────────────────────────────────────────────
    caseId:     { type: mongoose.Schema.Types.ObjectId, ref: "Case" },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // ── Status ────────────────────────────────────────────────────────────────
    status:   { type: String, enum: ["todo", "in_progress", "completed", "overdue", "cancelled"], default: "todo" },
    priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },

    // ── Dates ─────────────────────────────────────────────────────────────────
    dueDate:     { type: Date, required: true },
    completedAt: { type: Date },
    reminderAt:  { type: Date },

    // ── Type ──────────────────────────────────────────────────────────────────
    category: {
      type: String,
      enum: ["general", "document", "compliance", "hearing", "client_contact", "billing", "supervision"],
      default: "general",
    },

    isRecurring:       { type: Boolean, default: false },
    recurringInterval: { type: String, enum: ["daily", "weekly", "monthly", "quarterly"] },
  },
  { timestamps: true }
);

// Auto-mark overdue
taskSchema.pre("save", function (next) {
  if (this.status !== "completed" && this.status !== "cancelled") {
    if (this.dueDate && new Date(this.dueDate) < new Date()) {
      this.status = "overdue";
    }
  }
  next();
});

taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ caseId: 1 });
taskSchema.index({ dueDate: 1 });

module.exports = mongoose.model("Task", taskSchema);
