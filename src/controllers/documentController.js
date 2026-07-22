const path           = require("path");
const fs             = require("fs");
const Document       = require("../models/Document");
const { createAuditLog } = require("../utils/audit");
const { generatePDF }  = require("../utils/generatePDF");
const { generateDOCX } = require("../utils/generateDOCX");

const UPLOAD_DIR = path.join(__dirname, "../../uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ─── GET /api/documents ───────────────────────────────────────────────────────
const getDocuments = async (req, res, next) => {
  try {
    const { caseId, clientId, category } = req.query;
    const filter = { status: "active" };
    if (caseId)   filter.caseId   = caseId;
    if (clientId) filter.clientId = clientId;
    if (category && category !== "All") filter.category = category.toLowerCase().replace(/ /g, "_");

    const docs = await Document.find(filter)
      .populate("uploadedBy", "name")
      .populate("caseId",     "reference")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      documents: docs.map((d) => ({
        id:          d._id,
        name:        d.name,
        category:    d.category,
        caseId:      d.caseId?._id,
        caseRef:     d.caseId?.reference,
        clientId:    d.clientId,
        uploadedBy:  d.uploadedBy?.name,
        uploadedAt:  d.createdAt,
        size:        d.sizeLabel || `${Math.round((d.size || 0) / 1024)} KB`,
        version:     d.version,
        status:      d.status,
        isGenerated: d.isGenerated,
        mimeType:    d.mimeType,
      })),
    });
  } catch (err) { next(err); }
};

// ─── POST /api/documents/upload ───────────────────────────────────────────────
const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
    const { caseId, clientId, category, name } = req.body;

    const sizeKB    = req.file.size / 1024;
    const sizeLabel = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${Math.round(sizeKB)} KB`;

    const doc = await Document.create({
      name:         name || req.file.originalname,
      category:     category || "supporting",
      caseId:       caseId   || undefined,
      clientId:     clientId || undefined,
      uploadedBy:   req.user.userId,
      originalName: req.file.originalname,
      mimeType:     req.file.mimetype,
      size:         req.file.size,
      sizeLabel,
      storagePath:  req.file.path,
      storageType:  "local",
    });

    await createAuditLog(req, "CREATE", "Document", doc._id, `Uploaded: ${doc.name}`);
    res.status(201).json({ success: true, document: doc });
  } catch (err) { next(err); }
};

// ─── GET /api/documents/:id/download ─────────────────────────────────────────
const downloadDocument = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Document not found" });
    if (!doc.storagePath || !fs.existsSync(doc.storagePath)) {
      return res.status(404).json({ success: false, message: "File not found on server" });
    }
    res.setHeader("Content-Type", doc.mimeType || "application/octet-stream");
    res.download(doc.storagePath, doc.originalName || doc.name);
  } catch (err) { next(err); }
};

// ─── DELETE /api/documents/:id ────────────────────────────────────────────────
const deleteDocument = async (req, res, next) => {
  try {
    const doc = await Document.findByIdAndUpdate(req.params.id, { status: "deleted" }, { new: true });
    if (!doc) return res.status(404).json({ success: false, message: "Document not found" });
    await createAuditLog(req, "DELETE", "Document", doc._id, `Deleted: ${doc.name}`);
    res.json({ success: true, message: "Document deleted" });
  } catch (err) { next(err); }
};

// ─── POST /api/documents/generate ────────────────────────────────────────────
// format: "pdf" (default) | "docx"
const generateDocument = async (req, res, next) => {
  try {
    const { template, caseId, clientId, data, format = "pdf" } = req.body;
    if (!template) return res.status(400).json({ success: false, message: "template is required" });

    const templateLabel = template.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const dateLabel     = new Date().toLocaleDateString("en-GB");

    // Generate file in requested format
    let generated;
    if (format === "docx") {
      generated = await generateDOCX(template, data || {});
    } else {
      generated = await generatePDF(template, data || {});
    }

    const sizeBytes = fs.statSync(generated.filePath).size;
    const sizeLabel = sizeBytes > 1024 * 1024
      ? `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(sizeBytes / 1024)} KB`;

    const doc = await Document.create({
      name:          `${templateLabel} — ${dateLabel}`,
      category:      "generated",
      caseId:        caseId   || undefined,
      clientId:      clientId || undefined,
      uploadedBy:    req.user.userId,
      originalName:  generated.fileName,
      mimeType:      generated.mimeType,
      size:          sizeBytes,
      sizeLabel,
      storagePath:   generated.filePath,
      storageType:   "local",
      isGenerated:   true,
      templateUsed:  template,
      generatedData: data,
    });

    await createAuditLog(req, "CREATE", "Document", doc._id, `Generated ${format.toUpperCase()}: ${template}`);

    res.status(201).json({
      success:  true,
      document: {
        id:          doc._id,
        name:        doc.name,
        category:    doc.category,
        mimeType:    doc.mimeType,
        size:        doc.sizeLabel,
        isGenerated: true,
        downloadUrl: `/api/documents/${doc._id}/download`,
      },
    });
  } catch (err) { next(err); }
};

module.exports = { getDocuments, uploadDocument, downloadDocument, deleteDocument, generateDocument };
