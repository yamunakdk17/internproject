const db = require("../config/db");

const createAttempt = async ({ userId, quizTitle, category, answers }) => {
  const questionIds = answers.map((item) => item.question_id);

  const placeholders = questionIds.map(() => "?").join(",");

  const [questions] = await db.execute(
    `SELECT id, correct_answer
     FROM questions
     WHERE id IN (${placeholders})`,
    questionIds,
  );

  if (questions.length !== questionIds.length) {
    throw new Error("Some quiz questions could not be verified.");
  }

  const questionMap = new Map(
    questions.map((question) => [
      Number(question.id),
      String(question.correct_answer).trim().toUpperCase(),
    ]),
  );

  let correct = 0;
  let wrong = 0;
  let unanswered = 0;

  for (const answer of answers) {
    const correctAnswer = questionMap.get(Number(answer.question_id));

    if (!answer.selected_answer) {
      unanswered++;
    } else if (answer.selected_answer === correctAnswer) {
      correct++;
    } else {
      wrong++;
    }
  }

  const total = answers.length;

  // Match the existing quiz's 0.2 negative marking.
  const score = Math.max(0, correct - wrong * 0.2);

  const percentage = total ? Math.round((score / total) * 100) : 0;

  const [result] = await db.execute(
    `INSERT INTO quiz_attempts (
      user_id,
      quiz_title,
      category,
      total_questions,
      correct_answers,
      wrong_answers,
      unanswered_questions,
      score,
      percentage
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      quizTitle,
      category,
      total,
      correct,
      wrong,
      unanswered,
      score,
      percentage,
    ],
  );

  return {
    id: result.insertId,
    quizTitle,
    category,
    totalQuestions: total,
    correctAnswers: correct,
    wrongAnswers: wrong,
    unansweredQuestions: unanswered,
    score,
    percentage,
  };
};

const getStudentProgress = async (userId) => {
  const [summaryRows] = await db.execute(
    `SELECT
       COUNT(*) AS totalAttempts,
       COALESCE(ROUND(AVG(percentage), 1), 0)
         AS averageAccuracy,
       COUNT(DISTINCT category) AS sectorsPracticed,
       COUNT(DISTINCT DATE(created_at)) AS activeDays,
       COALESCE(SUM(total_questions), 0) AS totalQuestions,
       COALESCE(SUM(correct_answers), 0) AS correctAnswers,
       COALESCE(SUM(wrong_answers), 0) AS wrongAnswers
     FROM quiz_attempts
     WHERE user_id = ?`,
    [userId],
  );

  const [attempts] = await db.execute(
    `SELECT
       id,
       quiz_title,
       category,
       total_questions,
       correct_answers,
       wrong_answers,
       unanswered_questions,
       score,
       percentage,
       created_at
     FROM quiz_attempts
     WHERE user_id = ?
     ORDER BY created_at DESC, id DESC
     LIMIT 10`,
    [userId],
  );

  const [categories] = await db.execute(
    `SELECT
       category,
       ROUND(AVG(percentage), 1) AS averageAccuracy,
       COUNT(*) AS attempts
     FROM quiz_attempts
     WHERE user_id = ?
     GROUP BY category
     ORDER BY averageAccuracy ASC
     LIMIT 1`,
    [userId],
  );

  return {
    summary: summaryRows[0],
    attempts,
    weakestCategory: categories[0] || null,
  };
};

module.exports = {
  createAttempt,
  getStudentProgress,
};
