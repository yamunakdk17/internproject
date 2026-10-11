const questionModel = require("../models/questionModel");
const createError = require("../utils/error");

// Create a quiz question.
const createQuestion = async (questionData) => {
  const questionText = questionData.question_text?.trim();
  const category = questionData.category?.trim();
  const difficulty = questionData.difficulty?.trim();
  const correctAnswer = questionData.correct_answer?.trim().toUpperCase();

  if (!questionText || !category || !difficulty) {
    throw createError("Question, category, and difficulty are required.", 400);
  }

  const options = [
    questionData.option_a,
    questionData.option_b,
    questionData.option_c,
    questionData.option_d,
  ].map((option) => (typeof option === "string" ? option.trim() : ""));

  if (options.some((option) => !option)) {
    throw createError("All four answer options are required.", 400);
  }

  if (new Set(options.map((option) => option.toLowerCase())).size !== 4) {
    throw createError("Each answer option must be different.", 400);
  }

  if (!["A", "B", "C", "D"].includes(correctAnswer)) {
    throw createError("Correct answer must be A, B, C, or D.", 400);
  }

  const existingQuestion = await questionModel.findDuplicateQuestion({
    question_text: questionText,
    category,
  });

  if (existingQuestion) {
    throw createError("This question already exists in this category.", 409);
  }

  const totalQuestions = await questionModel.countQuestionsByCategory(category);

  if (totalQuestions >= 15) {
    throw createError(
      `The ${category} category already has 15 questions. You cannot add more.`,
      400,
    );
  }

  return questionModel.createQuestion({
    question_type: questionData.question_type || "MCQ",
    category,
    difficulty,
    question_text: questionText,
    option_a: options[0],
    option_b: options[1],
    option_c: options[2],
    option_d: options[3],
    correct_answer: correctAnswer,
    explanation: String(questionData.explanation || "").trim(),
  });
};

// Get all quiz questions.
const getQuestion = async () => {
  return questionModel.getQuestion();
};

// Update an existing question.
const updateQuestion = async (id, questionData) => {
  const questionText = questionData.question_text?.trim();
  const category = questionData.category?.trim();
  const difficulty = questionData.difficulty?.trim();
  const correctAnswer = questionData.correct_answer?.trim().toUpperCase();

  if (!questionText || !category || !difficulty) {
    throw createError("Question, category, and difficulty are required.", 400);
  }

  const options = [
    questionData.option_a,
    questionData.option_b,
    questionData.option_c,
    questionData.option_d,
  ].map((option) => (typeof option === "string" ? option.trim() : ""));

  if (options.some((option) => !option)) {
    throw createError("All four answer options are required.", 400);
  }

  if (new Set(options.map((option) => option.toLowerCase())).size !== 4) {
    throw createError("Each answer option must be different.", 400);
  }

  if (!["A", "B", "C", "D"].includes(correctAnswer)) {
    throw createError("Correct answer must be A, B, C, or D.", 400);
  }

  const existingQuestion = await questionModel.findQuestionById(id);

  if (!existingQuestion) {
    throw createError("Question not found.", 404);
  }

  const duplicate = await questionModel.findDuplicateQuestion({
    question_text: questionText,
    category,
    excludeId: id,
  });

  if (duplicate) {
    throw createError("This question already exists in this category.", 409);
  }

  const totalQuestions = await questionModel.countQuestionsByCategory(
    category,
    id,
  );

  if (totalQuestions >= 15) {
    throw createError(
      `The ${category} category already has 15 questions.`,
      400,
    );
  }

  return questionModel.updateQuestion(id, {
    question_type: questionData.question_type || "MCQ",
    category,
    difficulty,
    question_text: questionText,
    option_a: options[0],
    option_b: options[1],
    option_c: options[2],
    option_d: options[3],
    correct_answer: correctAnswer,
    explanation: String(questionData.explanation || "").trim(),
  });
};

// Delete an existing question.
const deleteQuestion = async (id) => {
  const existingQuestion = await questionModel.findQuestionById(id);

  if (!existingQuestion) {
    throw createError("Question not found.", 404);
  }

  return questionModel.deleteQuestion(id);
};

module.exports = {
  createQuestion,
  getQuestion,
  updateQuestion,
  deleteQuestion,
};
