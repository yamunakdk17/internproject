
const pastQuestionModel = require("../models/pastQuestionModel");

// Upload PDF or DOCX file information
const uploadPastQuestion = async (data) => {
  return await pastQuestionModel.createPastQuestionFile(data);
};

// Fetch uploaded PDF or DOCX files
const getPastQuestions = async () => {
  return await pastQuestionModel.getPastQuestionFiles();
};

module.exports = {
  uploadPastQuestion,
  getPastQuestions,
};
