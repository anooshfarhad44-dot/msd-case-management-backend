const Task = require("../models/Task");
const { createAuditLog } = require("../utils/audit");

// GET /api/tasks
const getTasks = async (req, res, next) => {
  try {
    const { status, assignedTo, caseId, priority } = req.query;
    const filter = {};

    if (req.user.role === "fee_earner") filter.assignedTo = req.user.userId;
    else if (assignedTo && assignedTo !== "all") filter.assignedTo = assignedTo;

    if (status   && status !== "all")   filter.status   = status;
    if (priority && priority !== "all") filter.priority = priority;
    if (caseId)                          filter.caseId   = caseId;

    const tasks = await Task.find(filter)
      .populate("assignedTo", "name email")
      .populate("createdBy",  "name")
      .populate("caseId",     "reference type")
      .sort({ dueDate: 1 });

    res.json({
      success: true,
      tasks: tasks.map((t) => ({
        id:             t._id,
        title:          t.title,
        description:    t.description,
        caseId:         t.caseId?._id,
        caseRef:        t.caseId?.reference,
        assignedTo:     t.assignedTo?._id,
        assignedToName: t.assignedTo?.name || "",
        createdBy:      t.createdBy?._id,
        status:         t.status,
        priority:       t.priority,
        category:       t.category,
        dueDate:        t.dueDate,
        completedAt:    t.completedAt,
        createdAt:      t.createdAt,
      })),
    });
  } catch (err) { next(err); }
};

// POST /api/tasks
const createTask = async (req, res, next) => {
  try {
    const { title, description, caseId, assignedToId, dueDate, priority, category } = req.body;
    if (!title || !assignedToId || !dueDate) {
      return res.status(400).json({ success: false, message: "title, assignedToId and dueDate are required" });
    }
    const task = await Task.create({
      title, description, caseId,
      assignedTo: assignedToId,
      createdBy:  req.user.userId,
      dueDate, priority, category,
    });
    await createAuditLog(req, "CREATE", "Task", task._id, `Created task: ${title}`);
    const populated = await task.populate("assignedTo", "name");
    res.status(201).json({ success: true, task: populated });
  } catch (err) { next(err); }
};

// PATCH /api/tasks/:id
const updateTask = async (req, res, next) => {
  try {
    const update = { ...req.body };
    if (update.status === "completed") update.completedAt = new Date();
    const task = await Task.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate("assignedTo", "name");
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });
    await createAuditLog(req, "UPDATE", "Task", task._id, `Task updated: ${task.title} → ${task.status}`);
    res.json({ success: true, task });
  } catch (err) { next(err); }
};

// DELETE /api/tasks/:id
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });
    await createAuditLog(req, "DELETE", "Task", req.params.id, `Deleted task: ${task.title}`);
    res.json({ success: true, message: "Task deleted" });
  } catch (err) { next(err); }
};

module.exports = { getTasks, createTask, updateTask, deleteTask };
