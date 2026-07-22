const express = require("express");
const router  = express.Router();
const { getTasks, createTask, updateTask, deleteTask } = require("../controllers/taskController");
const { authenticate, authorize } = require("../middleware/auth");

router.use(authenticate);

router.get("/",       getTasks);
router.post("/",      createTask);
router.patch("/:id",  updateTask);
router.delete("/:id", authorize("director","admin","supervisor"), deleteTask);

module.exports = router;
