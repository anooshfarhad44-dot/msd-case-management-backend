const User = require("../models/User");
const { signToken } = require("../utils/jwt");

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// Helper to format user for response
const formatUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  department: user.department || "",
  phone: user.phone || "",
  avatar: user.avatar || "",
  isActive: user.isActive,
  createdAt: user.createdAt.toISOString(),
});

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    // Find user — explicitly select password (select: false by default)
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Contact your administrator.",
      });
    }

    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Set httpOnly cookie
    res.cookie("token", token, COOKIE_OPTIONS);

    res.status(200).json({
      success: true,
      token,
      user: formatUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/logout
const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  res.status(200).json({ success: true, message: "Logged out successfully" });
};

// GET /api/auth/me  (requires authenticate middleware)
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, user: formatUser(user) });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/refresh  (requires authenticate middleware)
const refreshToken = (req, res, next) => {
  try {
    const newToken = signToken({
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role,
    });

    res.cookie("token", newToken, COOKIE_OPTIONS);
    res.status(200).json({ success: true, token: newToken });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, logout, getMe, refreshToken };
