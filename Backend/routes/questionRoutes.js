const express = require("express");
const router = express.Router();

const {
  createQuestion,
  getQuestion,
  updateQuestion,
  deleteQuestion,
} = require("../controllers/questionController");

const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

// Create — admin only.
router.post("/create", protect, allowRoles("admin"), createQuestion);

// Fetch existing questions.
router.get("/get", getQuestion);

// Update — admin only.
router.put("/:id", protect, allowRoles("admin"), updateQuestion);

// Delete — admin only.
router.delete("/:id", protect, allowRoles("admin"), deleteQuestion);

module.exports = router;
