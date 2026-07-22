const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    matterId: { type: mongoose.Schema.Types.ObjectId, ref: "Matter", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true, default: Date.now },
    category: { type: String, required: true }, // e.g., Court Fee, Travel, Expert
    amount: { type: Number, required: true, min: 0 },
    vatAmount: { type: Number, default: 0, min: 0 },
    narrative: { type: String, required: true },
    receiptId: { type: mongoose.Schema.Types.ObjectId, ref: "Document" },
    status: { type: String, enum: ["unbilled", "billed"], default: "unbilled" },
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice" },
  },
  { timestamps: true }
);

expenseSchema.index({ matterId: 1 });
expenseSchema.index({ status: 1 });

module.exports = mongoose.model("Expense", expenseSchema);
