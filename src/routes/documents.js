const express  = require("express");
const router   = express.Router();
const multer   = require("multer");
const path     = require("path");
const { getDocuments, uploadDocument, downloadDocument, deleteDocument, generateDocument } = require("../controllers/documentController");
const { authenticate } = require("../middleware/auth");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../../uploads")),
  filename:    (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB

router.use(authenticate);

router.get("/",              getDocuments);
router.post("/upload",       upload.single("file"), uploadDocument);
router.post("/generate",     generateDocument);
router.get("/:id/download",  downloadDocument);
router.delete("/:id",        deleteDocument);

module.exports = router;
