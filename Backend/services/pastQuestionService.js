const fs = require("fs/promises");
const path = require("path");
const pastQuestionModel = require("../models/pastQuestionModel");

// Upload a new paper
const uploadPastQuestion = async (data) => {
  return pastQuestionModel.createPastQuestionFile(data);
};

// Fetch all papers
const getPastQuestions = async () => {
  return pastQuestionModel.getPastQuestionFiles();
};

// Replace an existing paper
const updatePastQuestion = async (id, data) => {
  const existing = await pastQuestionModel.getPastQuestionFileById(id);

  if (!existing) {
    throw Object.assign(new Error("Past-question file not found."), {
      statusCode: 404,
    });
  }

  const updated = await pastQuestionModel.updatePastQuestionFile(id, data);

  if (!updated) {
    throw Object.assign(new Error("Failed to update the paper."), {
      statusCode: 500,
    });
  }

  // Remove old file only after the database update succeeds.
  if (existing.file_path && existing.file_path !== data.filePath) {
    try {
      await fs.unlink(existing.file_path);
    } catch (error) {
      if (error.code !== "ENOENT") {
        console.error("Could not remove replaced file:", error);
      }
    }
  }

  return pastQuestionModel.getPastQuestionFileById(id);
};

// Delete a paper and its uploaded file
const deletePastQuestion = async (id) => {
  const existing = await pastQuestionModel.getPastQuestionFileById(id);

  if (!existing) {
    throw Object.assign(new Error("Past-question file not found."), {
      statusCode: 404,
    });
  }

  const deleted = await pastQuestionModel.deletePastQuestionFile(id);

  if (!deleted) {
    throw Object.assign(new Error("Failed to delete the paper."), {
      statusCode: 500,
    });
  }

  if (existing.file_path) {
    try {
      await fs.unlink(existing.file_path);
    } catch (error) {
      if (error.code !== "ENOENT") {
        console.error("Could not remove deleted file:", error);
      }
    }
  }

  return { id: Number(id), deleted: true };
};

module.exports = {
  uploadPastQuestion,
  getPastQuestions,
  updatePastQuestion,
  deletePastQuestion,
};
