const express = require("express");
const router = express.Router();

const pastQuestionUpload = require("../middleware/pastQuestionMiddleware");

const {
  uploadPastQuestion,
  getPastQuestions,
  updatePastQuestion,
  deletePastQuestion,
  downloadPastQuestion,
} = require("../controllers/pastQuestionController");

const protectRoute = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

// Upload a new file
router.post(
  "/upload",
  protectRoute,
  allowRoles("admin"),
  pastQuestionUpload.single("file"),
  uploadPastQuestion,
);

// View the list of uploaded files
router.get("/", getPastQuestions);
// Download a past-question PDF
router.get("/:id/download", downloadPastQuestion);

// Replace an existing file
router.put(
  "/:id",
  protectRoute,
  allowRoles("admin"),
  pastQuestionUpload.single("file"),
  updatePastQuestion,
);

// Delete an existing file
router.delete("/:id", protectRoute, allowRoles("admin"), deletePastQuestion);

module.exports = router;
