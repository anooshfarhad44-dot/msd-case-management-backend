const User = require("../models/User");

const VALID_ROLES = [
  "director", "compliance", "supervisor", "fee_earner",
  "paralegal", "sales", "finance", "admin", "consultant", "client",
];

// GET /api/users  (director, admin only)
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users: users.map((u) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
        department: u.department || "",
        phone: u.phone || "",
        isActive: u.isActive,
        createdAt: u.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/users  (director, admin only)
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, department, phone } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: "Name, email, password and role are required" });
    }

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}` });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: "A user with this email already exists" });
    }

    const user = await User.create({ name, email, password, role, department, phone });

    res.status(201).json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/users/:id/status  (director, admin only)
const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({ success: true, isActive: user.isActive });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers, createUser, toggleUserStatus };
