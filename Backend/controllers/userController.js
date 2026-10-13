const userModel = require("../models/userModel");
const response = require("../utils/response");

// Get all registered users
const getAllUsers = async (req, res) => {
  try {
    const users = await userModel.getAllUsers();

    return response.success(res, "Users fetched successfully", users);
  } catch (error) {
    console.error("Get users error:", error);

    return response.error(res, "Failed to fetch users", 500);
  }
};

// Promote a student to admin or change admin back to student
const updateUserRole = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const { role } = req.body;

    if (!Number.isInteger(userId) || userId <= 0) {
      return response.error(res, "Invalid user ID", 400);
    }

    if (!["student", "admin"].includes(role)) {
      return response.error(res, "Invalid role", 400);
    }

    // Prevent the logged-in admin from removing their own access.
    if (userId === Number(req.user.id)) {
      return response.error(res, "You cannot change your own role", 400);
    }

    const [result] = await userModel.updateUserRole(userId, role);

    if (result.affectedRows === 0) {
      return response.error(res, "User not found or role unchanged", 404);
    }

    return response.success(res, "User role updated successfully", {
      userId,
      role,
    });
  } catch (error) {
    console.error("Update role error:", error);

    return response.error(res, "Failed to update user role", 500);
  }
};

module.exports = {
  getAllUsers,
  updateUserRole,
};
