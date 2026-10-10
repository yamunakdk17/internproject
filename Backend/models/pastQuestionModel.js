const db = require("../config/db");

// Save uploaded past-question file information
const createPastQuestionFile = async (data) => {
  const sql = `
    INSERT INTO past_questions (
      file_name,
      original_name,
      file_path,
      file_type
    )
    VALUES (?, ?, ?, ?)
  `;

  const [result] = await db.execute(sql, [
    data.fileName,
    data.originalName,
    data.filePath,
    data.fileType,
  ]);

  return {
    id: result.insertId,
    ...data,
  };
};

// Get all uploaded past-question files
const getPastQuestionFiles = async () => {
  const sql = `
    SELECT
      id,
      file_name,
      original_name,
      file_path,
      file_type,
      created_at
    FROM past_questions
    WHERE file_name IS NOT NULL
    ORDER BY created_at DESC
  `;

  const [rows] = await db.execute(sql);
  return rows;
};

module.exports = {
  createPastQuestionFile,
  getPastQuestionFiles,
};

