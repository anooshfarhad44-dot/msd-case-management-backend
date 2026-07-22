const Note   = require("../models/Note");
const Matter = require("../models/Matter");
const { createAuditLog } = require("../utils/audit");

// helper: check access
const canViewNote = (note, user) => {
  if (note.accessLevel === "supervisor_only") return ["supervisor","director","admin","compliance"].includes(user.role);
  if (note.accessLevel === "compliance_only") return ["compliance","director","admin"].includes(user.role);
  return true;
};

// GET /api/notes?matterId=...
const getNotes = async (req, res, next) => {
  try {
    const { matterId } = req.query;
    if (!matterId) return res.status(400).json({ success: false, message: "matterId required" });

    const allNotes = await Note.find({ matterId })
      .populate("authorId", "name role")
      .populate("lockedBy", "name")
      .populate("signOffBy", "name")
      .sort({ createdAt: -1 });

    // Filter by access level
    const notes = allNotes.filter(n => canViewNote(n, req.user));

    res.json({ success: true, notes });
  } catch (err) { next(err); }
};

// POST /api/notes
const createNote = async (req, res, next) => {
  try {
    const { matterId, title, body, accessLevel, linkedTaskId } = req.body;
    if (!matterId || !body) return res.status(400).json({ success: false, message: "matterId and body required" });

    const note = await Note.create({
      matterId, title, body, accessLevel,
      authorId: req.user.userId,
      linkedTaskId: linkedTaskId || undefined,
    });

    // Add to matter timeline
    await Matter.findByIdAndUpdate(matterId, {
      $push: {
        timeline: {
          type: "note",
          description: `Note added: ${title || "Untitled"}`,
          createdBy: req.user.userId,
          isAudit: false,
        }
      }
    });

    await createAuditLog(req, "CREATE", "Note", note._id, `Note created: ${title || "Untitled"}`);
    res.status(201).json({ success: true, note });
  } catch (err) { next(err); }
};

// PATCH /api/notes/:id
const updateNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: "Note not found" });
    if (note.locked) return res.status(403).json({ success: false, message: "Note is locked and cannot be edited" });
    if (!canViewNote(note, req.user)) return res.status(403).json({ success: false, message: "Access denied" });

    // Save version before editing
    note.versions.push({ body: note.body, editedBy: req.user.userId });

    if (req.body.title !== undefined) note.title = req.body.title;
    if (req.body.body !== undefined)  note.body  = req.body.body;
    if (req.body.accessLevel)         note.accessLevel = req.body.accessLevel;

    await note.save();
    await createAuditLog(req, "UPDATE", "Note", note._id, `Note updated: ${note.title}`);
    res.json({ success: true, note });
  } catch (err) { next(err); }
};

// POST /api/notes/:id/lock
const lockNote = async (req, res, next) => {
  try {
    if (!["director","admin","supervisor"].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Only supervisors can lock notes" });
    }
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: "Note not found" });
    if (note.locked) return res.status(400).json({ success: false, message: "Note already locked" });

    note.locked   = true;
    note.lockedAt = new Date();
    note.lockedBy = req.user.userId;
    await note.save();

    await createAuditLog(req, "UPDATE", "Note", note._id, `Note locked: ${note.title}`);
    res.json({ success: true, note });
  } catch (err) { next(err); }
};

// POST /api/notes/:id/signoff
const signOffNote = async (req, res, next) => {
  try {
    if (!["director","admin","supervisor"].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Only supervisors can sign off notes" });
    }
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: "Note not found" });
    if (!note.locked) return res.status(400).json({ success: false, message: "Note must be locked before sign-off" });

    note.signedOff = true;
    note.signOffBy = req.user.userId;
    note.signOffAt = new Date();
    await note.save();

    await createAuditLog(req, "UPDATE", "Note", note._id, `Note signed off: ${note.title}`);
    res.json({ success: true, note });
  } catch (err) { next(err); }
};

// GET /api/notes/:id/versions
const getNoteVersions = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id).populate("versions.editedBy", "name");
    if (!note) return res.status(404).json({ success: false, message: "Note not found" });
    if (!canViewNote(note, req.user)) return res.status(403).json({ success: false, message: "Access denied" });
    res.json({ success: true, versions: note.versions });
  } catch (err) { next(err); }
};

module.exports = { getNotes, createNote, updateNote, lockNote, signOffNote, getNoteVersions };
