const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  createAttempt,
  getStudentProgress,
} = require("../controllers/quizAttemptController");

router.post("/", protect, createAttempt);
router.get("/", protect, getStudentProgress);

module.exports = router;
