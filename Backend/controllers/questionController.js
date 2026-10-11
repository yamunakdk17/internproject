const questionService = require("../services/questionService");
const response = require("../utils/response");

// Create a quiz question.
const createQuestion = async (req, res) => {
  try {
    const result = await questionService.createQuestion(req.body);

    return response.created(res, "Question created successfully.", {
      questionId: result.insertId,
    });
  } catch (error) {
    console.error("Create question error:", error);

    return response.error(
      res,
      error.message || "Failed to create question.",
      error.statusCode || 500,
    );
  }
};

// Get all quiz questions.
const getQuestion = async (req, res) => {
  try {
    const questions = await questionService.getQuestion();

    return response.success(res, "Questions fetched successfully.", {
      count: questions.length,
      questions,
    });
  } catch (error) {
    console.error("Get questions error:", error);

    return response.error(
      res,
      error.message || "Failed to get questions.",
      error.statusCode || 500,
    );
  }
};

// Update a question.
const updateQuestion = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return response.error(res, "Invalid question ID.", 400);
    }

    const result = await questionService.updateQuestion(id, req.body);

    return response.success(res, "Question updated successfully.", {
      questionId: id,
      affectedRows: result.affectedRows,
    });
  } catch (error) {
    console.error("Update question error:", error);

    return response.error(
      res,
      error.message || "Failed to update question.",
      error.statusCode || 500,
    );
  }
};

// Delete a question.
const deleteQuestion = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return response.error(res, "Invalid question ID.", 400);
    }

    await questionService.deleteQuestion(id);

    return response.success(res, "Question deleted successfully.", {
      questionId: id,
    });
  } catch (error) {
    console.error("Delete question error:", error);

    return response.error(
      res,
      error.message || "Failed to delete question.",
      error.statusCode || 500,
    );
  }
};

module.exports = {
  createQuestion,
  getQuestion,
  updateQuestion,
  deleteQuestion,
};
