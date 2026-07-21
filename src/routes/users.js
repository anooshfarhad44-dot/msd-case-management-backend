const express = require("express");
const router = express.Router();
const { getUsers, createUser, toggleUserStatus } = require("../controllers/userController");
const { authenticate, authorize } = require("../middleware/auth");

// All routes require authentication + director or admin role
router.use(authenticate, authorize("director", "admin"));

router.get("/", getUsers);
router.post("/", createUser);
router.patch("/:id/status", toggleUserStatus);

module.exports = router;
