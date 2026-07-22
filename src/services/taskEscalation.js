const Task   = require("../models/Task");
const Matter = require("../models/Matter");

/**
 * Task Escalation Ladder (6.15)
 * Level 0 -> 1: Task becomes overdue -> mark status overdue, increment escalationLevel to 1, log timeline entry on related matter
 * Level 1 -> 2: Overdue > 24 hours -> increment escalationLevel to 2, priority set to urgent
 */
const runTaskEscalation = async () => {
  try {
    const now = new Date();
    
    // Find all uncompleted/uncancelled tasks past due date
    const overdueTasks = await Task.find({
      status: { $nin: ["completed", "cancelled"] },
      dueDate: { $lt: now }
    });

    let escalatedCount = 0;

    for (const task of overdueTasks) {
      let changed = false;

      if (task.status !== "overdue") {
        task.status = "overdue";
        changed = true;
      }

      if (task.escalationLevel === 0) {
        task.escalationLevel = 1;
        task.lastEscalatedAt = now;
        changed = true;
        escalatedCount++;
      } else if (task.escalationLevel === 1 && task.lastEscalatedAt) {
        const hoursPassed = (now - new Date(task.lastEscalatedAt)) / (1000 * 60 * 60);
        if (hoursPassed >= 24) {
          task.escalationLevel = 2;
          task.priority = "urgent";
          task.lastEscalatedAt = now;
          changed = true;
          escalatedCount++;
        }
      }

      if (changed) {
        await task.save();

        if (task.caseId) {
          const matter = await Matter.findById(task.caseId);
          if (matter) {
            matter.timeline.push({
              type: "audit",
              description: `TASK ESCALATION (Level ${task.escalationLevel}): Task "${task.title}" is overdue`,
              isAudit: true,
            });
            await matter.save();
          }
        }
      }
    }

    return { success: true, processed: overdueTasks.length, escalatedCount };
  } catch (err) {
    console.error("Task escalation error:", err);
    return { success: false, error: err.message };
  }
};

module.exports = { runTaskEscalation };
