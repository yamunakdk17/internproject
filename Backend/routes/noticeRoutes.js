const express = require("express");
const router = express.Router();

const {
  getAllNotices,
  getNoticeById,
  getNoticesBySector,
  createNotice,
  updateNotice,
  deleteNotice,
} = require("../controllers/noticeController");

const upload = require("../middleware/uploadNoticeMiddleware");
const protect = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/requireAdmin");

// Public read access
router.get("/", getAllNotices);
router.get("/sector/:sector", getNoticesBySector);
router.get("/:id", getNoticeById);

// Admin-only write access
router.post("/create", protect, requireAdmin, upload, createNotice);
router.put("/:id", protect, requireAdmin, upload, updateNotice);
router.delete("/:id", protect, requireAdmin, deleteNotice);

module.exports = router;
