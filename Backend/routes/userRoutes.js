const express = require("express");
const router = express.Router();

const {
  getAllUsers,
  updateUserRole,
} = require("../controllers/userController");

const protect = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/requireAdmin");

// Fetch all users — admin only
router.get("/", protect, requireAdmin, getAllUsers);

// Change a user's role — admin only
router.patch("/:id/role", protect, requireAdmin, updateUserRole);

module.exports = router;
