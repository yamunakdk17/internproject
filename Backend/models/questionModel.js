const db = require("../config/db");

// Find duplicate questions within the same category.
// When editing, exclude the question being edited.
const findDuplicateQuestion = async ({
  question_text,
  category,
  excludeId = null,
}) => {
  let sql = `
    SELECT id
    FROM questions
    WHERE LOWER(TRIM(question_text)) = LOWER(TRIM(?))
      AND LOWER(TRIM(category)) = LOWER(TRIM(?))
  `;

  const params = [question_text, category];

  if (excludeId !== null) {
    sql += " AND id <> ?";
    params.push(excludeId);
  }

  sql += " LIMIT 1";

  const [rows] = await db.execute(sql, params);
  return rows[0] || null;
};

// Count questions in a category.
const countQuestionsByCategory = async (category, excludeId = null) => {
  let sql = `
    SELECT COUNT(*) AS total
    FROM questions
    WHERE LOWER(TRIM(category)) = LOWER(TRIM(?))
  `;

  const params = [category];

  if (excludeId !== null) {
    sql += " AND id <> ?";
    params.push(excludeId);
  }

  const [rows] = await db.execute(sql, params);
  return Number(rows[0].total);
};

// Find a question by ID.
const findQuestionById = async (id) => {
  const [rows] = await db.execute(
    "SELECT id FROM questions WHERE id = ? LIMIT 1",
    [id],
  );

  return rows[0] || null;
};

// Create a quiz question.
const createQuestion = async (questionData) => {
  const {
    question_type,
    category,
    difficulty,
    question_text,
    option_a,
    option_b,
    option_c,
    option_d,
    correct_answer,
    explanation,
  } = questionData;

  const sql = `
    INSERT INTO questions (
      question_type,
      category,
      difficulty,
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer,
      explanation
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const [result] = await db.execute(sql, [
    question_type || "MCQ",
    category || null,
    difficulty,
    question_text.trim(),
    option_a,
    option_b,
    option_c,
    option_d,
    correct_answer,
    explanation || "",
  ]);

  return result;
};

// Get all quiz questions.
const getQuestion = async () => {
  const sql = `
    SELECT
      id,
      question_type,
      category,
      difficulty,
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer,
      explanation,
      created_at
    FROM questions
    ORDER BY id DESC
  `;

  const [rows] = await db.execute(sql);
  return rows;
};

// Update an existing quiz question.
const updateQuestion = async (id, questionData) => {
  const {
    question_type,
    category,
    difficulty,
    question_text,
    option_a,
    option_b,
    option_c,
    option_d,
    correct_answer,
    explanation,
  } = questionData;

  const sql = `
    UPDATE questions
    SET
      question_type = ?,
      category = ?,
      difficulty = ?,
      question_text = ?,
      option_a = ?,
      option_b = ?,
      option_c = ?,
      option_d = ?,
      correct_answer = ?,
      explanation = ?
    WHERE id = ?
  `;

  const [result] = await db.execute(sql, [
    question_type || "MCQ",
    category,
    difficulty,
    question_text,
    option_a,
    option_b,
    option_c,
    option_d,
    correct_answer,
    explanation || "",
    id,
  ]);

  return result;
};

// Delete a quiz question.
const deleteQuestion = async (id) => {
  const [result] = await db.execute("DELETE FROM questions WHERE id = ?", [id]);

  return result;
};

module.exports = {
  createQuestion,
  getQuestion,
  findDuplicateQuestion,
  countQuestionsByCategory,
  findQuestionById,
  updateQuestion,
  deleteQuestion,
};
