const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    userId:     { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    userName:   { type: String },
    userRole:   { type: String },

    action:     { type: String, required: true },   // CREATE, UPDATE, DELETE, VIEW, LOGIN, LOGOUT
    resource:   { type: String, required: true },   // Case, Client, Invoice, etc.
    resourceId: { type: String },
    details:    { type: String },

    // HTTP context
    method:     { type: String },
    path:       { type: String },
    statusCode: { type: Number },
    ip:         { type: String },
    userAgent:  { type: String },

    // Changed data (for updates)
    previousData: { type: mongoose.Schema.Types.Mixed },
    newData:      { type: mongoose.Schema.Types.Mixed },
  },
  {
    timestamps: true,
    // Audit logs are immutable
    capped: false,
  }
);

auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ resource: 1, resourceId: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
