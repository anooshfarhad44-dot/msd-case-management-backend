const express = require("express");
const router = express.Router();
const { login, logout, getMe, refreshToken } = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");

router.post("/login", login);
router.post("/logout", logout);
router.get("/me", authenticate, getMe);
router.post("/refresh", authenticate, refreshToken);

module.exports = router;
