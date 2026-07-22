const MatterTemplate = require("../models/MatterTemplate");
const { createAuditLog } = require("../utils/audit");

// Get all active templates
const getTemplates = async (req, res, next) => {
  try {
    const { practiceArea } = req.query;
    const filter = { isActive: true };
    if (practiceArea && practiceArea !== "all") {
      filter.practiceArea = practiceArea;
    }
    const templates = await MatterTemplate.find(filter)
      .populate("createdBy", "name email")
      .sort({ name: 1 });
    res.json({ success: true, templates });
  } catch (err) {
    next(err);
  }
};

// Get a single template by ID
const getTemplateById = async (req, res, next) => {
  try {
    const template = await MatterTemplate.findById(req.params.id)
      .populate("createdBy", "name email");
    if (!template) {
      return res.status(404).json({ success: false, message: "Template not found" });
    }
    res.json({ success: true, template });
  } catch (err) {
    next(err);
  }
};

// Create a new template
const createTemplate = async (req, res, next) => {
  try {
    const template = await MatterTemplate.create({
      ...req.body,
      createdBy: req.user.userId
    });
    await createAuditLog(
      req, "CREATE", "MatterTemplate", template._id,
      `Created template: ${template.name}`
    );
    res.status(201).json({ success: true, template });
  } catch (err) {
    next(err);
  }
};

// Update a template
const updateTemplate = async (req, res, next) => {
  try {
    const template = await MatterTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: "Template not found" });
    }
    Object.assign(template, req.body);
    await template.save();
    await createAuditLog(
      req, "UPDATE", "MatterTemplate", template._id,
      `Updated template: ${template.name}`
    );
    res.json({ success: true, template });
  } catch (err) {
    next(err);
  }
};

// Delete (deactivate) a template
const deleteTemplate = async (req, res, next) => {
  try {
    const template = await MatterTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: "Template not found" });
    }
    template.isActive = false;
    await template.save();
    await createAuditLog(
      req, "UPDATE", "MatterTemplate", template._id,
      `Deactivated template: ${template.name}`
    );
    res.json({ success: true, template });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate
};
