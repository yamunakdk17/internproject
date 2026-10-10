const express = require("express");
const router = express.Router();

const pastQuestionUpload = require("../middleware/pastQuestionMiddleware");

const {
  uploadPastQuestion,
  getPastQuestions,
} = require("../controllers/pastQuestionController");

const protectRoute = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

// Protected: only admins can upload
router.post(
  "/upload",
  protectRoute,
  allowRoles("admin"),
  pastQuestionUpload.single("file"),
  uploadPastQuestion
);

// Fetch uploaded files
router.get("/", getPastQuestions);

module.exports = router;
