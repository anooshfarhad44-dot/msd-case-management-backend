const AuditLog = require("../models/AuditLog");

/**
 * Create an audit log entry.
 * @param {object} req       - Express request (for user context + IP)
 * @param {string} action    - CREATE | UPDATE | DELETE | VIEW | LOGIN | LOGOUT
 * @param {string} resource  - Model name: Case, Client, Invoice, etc.
 * @param {*}      resourceId
 * @param {string} details   - Human-readable description
 */
async function createAuditLog(req, action, resource, resourceId, details) {
  try {
    await AuditLog.create({
      userId:     req.user?.userId,
      userName:   req.user?.email,
      userRole:   req.user?.role,
      action,
      resource,
      resourceId: resourceId?.toString(),
      details,
      method:     req.method,
      path:       req.originalUrl,
      ip:         req.ip || req.connection?.remoteAddress,
      userAgent:  req.headers?.["user-agent"],
    });
  } catch {
    // Audit logging failures must never break the main request
  }
}

module.exports = { createAuditLog };
