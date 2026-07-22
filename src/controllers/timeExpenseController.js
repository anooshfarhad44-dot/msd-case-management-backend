const TimeEntry = require("../models/TimeEntry");
const Expense = require("../models/Expense");
const Matter = require("../models/Matter");
const { createAuditLog } = require("../utils/audit");

// ── Time Entries ─────────────────────────────────────────────────────────────

exports.getTimeEntries = async (req, res, next) => {
  try {
    const timeEntries = await TimeEntry.find({ matterId: req.params.id })
      .populate("userId", "name role")
      .sort({ date: -1 });
    res.json({ success: true, timeEntries });
  } catch (err) { next(err); }
};

exports.createTimeEntry = async (req, res, next) => {
  try {
    const { duration, category, hourlyRate, narrative, date } = req.body;
    if (!duration || duration <= 0) return res.status(400).json({ success: false, message: "Invalid duration" });

    const matter = await Matter.findById(req.params.id);
    if (!matter) return res.status(404).json({ success: false, message: "Matter not found" });

    const timeEntry = await TimeEntry.create({
      matterId: matter._id,
      userId: req.user._id,
      date: date || new Date(),
      duration,
      category,
      hourlyRate,
      narrative,
    });

    // Update matter WIP
    matter.wip += timeEntry.totalAmount;
    await matter.save();

    res.status(201).json({ success: true, timeEntry });
  } catch (err) { next(err); }
};

// ── Expenses ─────────────────────────────────────────────────────────────────

exports.getExpenses = async (req, res, next) => {
  try {
    const expenses = await Expense.find({ matterId: req.params.id })
      .populate("userId", "name role")
      .populate("receiptId", "filename")
      .sort({ date: -1 });
    res.json({ success: true, expenses });
  } catch (err) { next(err); }
};

exports.createExpense = async (req, res, next) => {
  try {
    const { amount, vatAmount, category, narrative, receiptId, date } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ success: false, message: "Invalid amount" });

    const matter = await Matter.findById(req.params.id);
    if (!matter) return res.status(404).json({ success: false, message: "Matter not found" });

    const expense = await Expense.create({
      matterId: matter._id,
      userId: req.user._id,
      date: date || new Date(),
      amount,
      vatAmount: vatAmount || 0,
      category,
      narrative,
      receiptId
    });

    // Optionally update a disbursement/expense total on the matter if required
    // matter.expensesTotal = (matter.expensesTotal || 0) + amount + vatAmount;
    // await matter.save();

    res.status(201).json({ success: true, expense });
  } catch (err) { next(err); }
};
