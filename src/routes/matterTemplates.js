const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const matterTemplateController = require("../controllers/matterTemplateController");

// Apply auth middleware to all routes
router.use(authenticate);

// Get all active templates
router.get("/", matterTemplateController.getTemplates);

// Get a single template by ID
router.get("/:id", matterTemplateController.getTemplateById);

// Create a template (only admin/director/supervisor)
router.post("/", (req, res, next) => {
  if (!["admin", "director", "supervisor"].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }
  next();
}, matterTemplateController.createTemplate);

// Update a template (only admin/director/supervisor)
router.patch("/:id", (req, res, next) => {
  if (!["admin", "director", "supervisor"].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }
  next();
}, matterTemplateController.updateTemplate);

// Delete (deactivate) a template (only admin/director/supervisor)
router.delete("/:id", (req, res, next) => {
  if (!["admin", "director", "supervisor"].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }
  next();
}, matterTemplateController.deleteTemplate);

module.exports = router;
