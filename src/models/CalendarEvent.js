const mongoose = require("mongoose");

const calendarEventSchema = new mongoose.Schema(
  {
    matterId: { type: mongoose.Schema.Types.ObjectId, ref: "Matter" }, // Optional, could be a general event
    title: { type: String, required: true },
    description: { type: String },
    eventType: { type: String, enum: ["hearing", "meeting", "deadline", "other"], default: "meeting" },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    location: { type: String },
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isLegalDeadline: { type: Boolean, default: false }, // If true, missed triggers workflow
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

calendarEventSchema.index({ startDate: 1 });
calendarEventSchema.index({ attendees: 1 });
calendarEventSchema.index({ matterId: 1 });

module.exports = mongoose.model("CalendarEvent", calendarEventSchema);
