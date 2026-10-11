const express = require("express");
const cors = require("cors");
require("dotenv").config();
const path = require("path");
const fs = require("fs");

const authRoutes = require("./routes/authRoutes");
const questionRoutes = require("./routes/questionRoutes");
const pastQuestionRoutes = require("./routes/pastQuestionRoutes");
const noticeRoutes = require("./routes/noticeRoutes");
const quizAttemptRoutes = require("./routes/quizAttemptRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Static files

app.use(
  "/uploads/past-questions",
  express.static(path.join(__dirname, "uploads", "past-questions"), {
    setHeaders: (res, filePath) => {
      if (path.extname(filePath).toLowerCase() === ".pdf") {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "inline");
      }
    },
  }),
);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// Home route
app.get("/", (req, res) => {
  res.json({
    message: "Loksewa Quiz API is running",
  });
});

// API routes
app.use("/api/auth",authRoutes);
app.use("/api/questions",questionRoutes);
app.use("/api/admin/past-questions",pastQuestionRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/quiz-attempts",quizAttemptRoutes);

module.exports = app;
