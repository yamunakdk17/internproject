const fs = require("fs/promises");
const pastQuestionService = require("../services/pastQuestionService");
const response = require("../utils/response");

// Upload a new past-question file
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
      title: req.body.title,
      subject: req.body.subject,
      province: req.body.province,
      examDate: req.body.examDate,
      level: req.body.level,
      year: req.body.year,
      description: req.body.description,
    });

    return response.success(
      res,
      "Past question uploaded successfully.",
      result,
    );
  } catch (error) {
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    console.error("PAST QUESTION UPLOAD ERROR:", error);
    return response.error(
      res,
      error.message || "Failed to upload past question.",
      error.statusCode || 500,
    );
  }
};

// Fetch all past-question files
const getPastQuestions = async (req, res) => {
  try {
    const files = await pastQuestionService.getPastQuestions();

    return response.success(res, "Past questions fetched successfully.", files);
  } catch (error) {
    console.error("GET PAST QUESTIONS ERROR:", error);
    return response.error(
      res,
      error.message || "Failed to fetch past questions.",
      error.statusCode || 500,
    );
  }
};
// Download a past-question file
const downloadPastQuestion = async (req, res) => {
  try {
    const file = await pastQuestionService.getPastQuestionById(
      req.params.id
    );

    if (!file) {
      return response.error(res, "Past question not found.", 404);
    }

    const filePath = file.file_path;

    await fs.access(filePath);

    return res.download(
      filePath,
      file.original_name || file.file_name,
      (error) => {
        if (error) {
          console.error("DOWNLOAD PAST QUESTION ERROR:", error);

          if (!res.headersSent) {
            return response.error(
              res,
              "Failed to download past question.",
              500
            );
          }
        }
      }
    );
  } catch (error) {
    console.error("DOWNLOAD PAST QUESTION ERROR:", error);

    if (error.code === "ENOENT") {
      return response.error(res, "File not found on the server.", 404);
    }

    return response.error(
      res,
      error.message || "Failed to download past question.",
      error.statusCode || 500
    );
  }
};

// Replace an existing file
const updatePastQuestion = async (req, res) => {
  try {
    if (!req.file) {
      return response.error(res, "Please select a replacement file.", 400);
    }

    const result = await pastQuestionService.updatePastQuestion(req.params.id, {
      fileName: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileType: req.file.mimetype,
    });

    return response.success(res, "Past question updated successfully.", result);
  } catch (error) {
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    console.error("UPDATE PAST QUESTION ERROR:", error);
    return response.error(
      res,
      error.message || "Failed to update past question.",
      error.statusCode || 500,
    );
  }
};

// Delete an existing file
const deletePastQuestion = async (req, res) => {
  try {
    const result = await pastQuestionService.deletePastQuestion(req.params.id);

    return response.success(res, "Past question deleted successfully.", result);
  } catch (error) {
    console.error("DELETE PAST QUESTION ERROR:", error);
    return response.error(
      res,
      error.message || "Failed to delete past question.",
      error.statusCode || 500,
    );
  }
};

module.exports = {
  uploadPastQuestion,
  getPastQuestions,
  downloadPastQuestion,
  updatePastQuestion,
  deletePastQuestion,
};
