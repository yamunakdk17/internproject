const pastQuestionService = require("../services/pastQuestionService");
const response = require("../utils/response");

// Upload past-question PDF or DOCX
const uploadPastQuestion = async (req, res) => {
  try {
    if (!req.file) {
      return response.error(res, "Please select a PDF or DOCX file.", 400);
    }

    const result = await pastQuestionService.uploadPastQuestion({
      fileName: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileType: req.file.mimetype,
    });
    pastQuestionModel.getPastQuestionFiles();

    return response.success(
      res,
      "Past question uploaded successfully.",
      result
    );
  } catch (error) {
    console.error("PAST QUESTION UPLOAD ERROR:", error);

    return response.error(
      res,
      error.message || "Failed to upload past question.",
      error.statusCode || 500
    );
  }
};

// Fetch uploaded past-question files
const getPastQuestions = async (req, res) => {
  try {
    const files = await pastQuestionService.getPastQuestions();

    return response.success(
      res,
      "Past questions fetched successfully.",
      files
    );
  } catch (error) {
    console.error("GET PAST QUESTIONS ERROR:", error);

    return response.error(
      res,
      error.message || "Failed to fetch past questions.",
      error.statusCode || 500
    );
  }
};

module.exports = {
  uploadPastQuestion,
  getPastQuestions,
};
