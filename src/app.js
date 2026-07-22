const express      = require("express");
const cors         = require("cors");
const helmet       = require("helmet");
const morgan       = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit    = require("express-rate-limit");
const path         = require("path");

const authRoutes       = require("./routes/auth");
const userRoutes       = require("./routes/users");
const clientRoutes     = require("./routes/clients");
const caseRoutes       = require("./routes/cases");
const taskRoutes       = require("./routes/tasks");
const invoiceRoutes    = require("./routes/invoices");
const leadRoutes       = require("./routes/leads");
const documentRoutes   = require("./routes/documents");
const complianceRoutes = require("./routes/compliance");
const { errorHandler, notFound } = require("./middleware/errorHandler");

const app = express();

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  "http://localhost:3001",
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Auth rate limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many attempts. Try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Body / Cookie parsing ─────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Logging ──────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") app.use(morgan("dev"));

// ─── Static uploads ───────────────────────────────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "MSD CMS API is running", timestamp: new Date().toISOString() });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth",       authLimiter, authRoutes);
app.use("/api/users",      userRoutes);
app.use("/api/clients",    clientRoutes);
app.use("/api/cases",      caseRoutes);
app.use("/api/tasks",      taskRoutes);
app.use("/api/invoices",   invoiceRoutes);
app.use("/api/leads",      leadRoutes);
app.use("/api/documents",  documentRoutes);
app.use("/api/compliance", complianceRoutes);

// ─── Error handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
