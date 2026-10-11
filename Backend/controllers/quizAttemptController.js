const quizAttemptModel = require("../models/quizAttemptModel");
const response = require("../utils/response");

const createAttempt = async (req, res) => {
  try {
    const { quizTitle, category, answers } = req.body;

    if (
      !req.user?.id ||
      !quizTitle?.trim() ||
      !category?.trim() ||
      !Array.isArray(answers) ||
      answers.length === 0
    ) {
      return response.error(
        res,
        "Valid quiz details and answers are required.",
        400,
      );
    }

    const questionIds = new Set();

    for (const item of answers) {
      const questionId = Number(item.question_id);

      if (
        !Number.isInteger(questionId) ||
        questionId <= 0 ||
        questionIds.has(questionId)
      ) {
        return response.error(
          res,
          "Quiz answers contain an invalid or duplicate question.",
          400,
        );
      }

      questionIds.add(questionId);

      const selected = item.selected_answer;

      if (
        selected !== null &&
        selected !== undefined &&
        !["A", "B", "C", "D"].includes(selected)
      ) {
        return response.error(res, "Invalid selected answer.", 400);
      }
    }

    const normalizedAnswers = answers.map((item) => ({
      question_id: Number(item.question_id),
      selected_answer:
        item.selected_answer == null ? null : item.selected_answer,
    }));

    const attempt = await quizAttemptModel.createAttempt({
      userId: req.user.id,
      quizTitle: quizTitle.trim(),
      category: category.trim(),
      answers: normalizedAnswers,
    });

    return response.success(
      res,
      "Quiz result saved successfully.",
      attempt,
      201,
    );
  } catch (error) {
    console.error("Save quiz result error:", error);

    return response.error(res, "Unable to save quiz result.", 500);
  }
};

const getStudentProgress = async (req, res) => {
  try {
    const progress = await quizAttemptModel.getStudentProgress(req.user.id);

    return response.success(
      res,
      "Student progress loaded successfully.",
      progress,
    );
  } catch (error) {
    console.error("Load student progress error:", error);

    return response.error(res, "Unable to load student progress.", 500);
  }
};

module.exports = {
  createAttempt,
  getStudentProgress,
};
