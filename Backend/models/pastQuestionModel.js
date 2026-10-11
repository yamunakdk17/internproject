const db = require("../config/db");

const ensurePastQuestionColumns = async () => {
  const [columns] = await db.query("SHOW COLUMNS FROM past_questions");
  const existingColumns = new Set(columns.map((column) => column.Field));

  const additions = [];

  if (!existingColumns.has("title")) {
    additions.push(
      "ALTER TABLE past_questions ADD COLUMN title VARCHAR(255) NULL AFTER file_path",
    );
  }

  if (!existingColumns.has("subject")) {
    additions.push(
      "ALTER TABLE past_questions ADD COLUMN subject VARCHAR(120) NULL AFTER title",
    );
  }

  if (!existingColumns.has("province")) {
    additions.push(
      "ALTER TABLE past_questions ADD COLUMN province VARCHAR(120) NULL AFTER subject",
    );
  }

  if (!existingColumns.has("exam_date")) {
    additions.push(
      "ALTER TABLE past_questions ADD COLUMN exam_date DATE NULL AFTER province",
    );
  }

  if (!existingColumns.has("level")) {
    additions.push(
      "ALTER TABLE past_questions ADD COLUMN level VARCHAR(120) NULL AFTER exam_date",
    );
  }

  if (!existingColumns.has("year")) {
    additions.push(
      "ALTER TABLE past_questions ADD COLUMN year VARCHAR(20) NULL AFTER level",
    );
  }

  if (!existingColumns.has("description")) {
    additions.push(
      "ALTER TABLE past_questions ADD COLUMN description TEXT NULL AFTER year",
    );
  }

  for (const query of additions) {
    await db.query(query);
  }
};

// Save uploaded file information
const createPastQuestionFile = async (data) => {
  await ensurePastQuestionColumns();

  const sql = `
    INSERT INTO past_questions (
      file_name,
      original_name,
      file_path,
      file_type,
      title,
      subject,
      province,
      exam_date,
      level,
      year,
      description
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const [result] = await db.execute(sql, [
    data.fileName,
    data.originalName,
    data.filePath,
    data.fileType,
    data.title || null,
    data.subject || null,
    data.province || null,
    data.examDate || null,
    data.level || null,
    data.year || null,
    data.description || null,
  ]);

  return {
    id: result.insertId,
    ...data,
  };
};

// Get all uploaded files
const getPastQuestionFiles = async () => {
  await ensurePastQuestionColumns();

  const sql = `
    SELECT
      id,
      file_name,
      original_name,
      file_path,
      file_type,
      title,
      subject,
      province,
      exam_date,
      level,
      year,
      description,
      created_at
    FROM past_questions
    WHERE file_name IS NOT NULL
    ORDER BY created_at DESC
  `;

  const [rows] = await db.execute(sql);
  return rows;
};

// Find one file by ID
const getPastQuestionFileById = async (id) => {
  await ensurePastQuestionColumns();

  const [rows] = await db.execute(
    `SELECT id, file_name, original_name, file_path, file_type, title, subject, province, exam_date, level, year, description, created_at
     FROM past_questions
     WHERE id = ?`,
    [id],
  );

  return rows[0] || null;
};

// Replace an existing file's information
const updatePastQuestionFile = async (id, data) => {
  await ensurePastQuestionColumns();

  const [result] = await db.execute(
    `UPDATE past_questions
     SET file_name = ?,
         original_name = ?,
         file_path = ?,
         file_type = ?,
         title = ?,
         subject = ?,
         province = ?,
         exam_date = ?,
         level = ?,
         year = ?,
         description = ?
     WHERE id = ?`,
    [
      data.fileName,
      data.originalName,
      data.filePath,
      data.fileType,
      data.title || null,
      data.subject || null,
      data.province || null,
      data.examDate || null,
      data.level || null,
      data.year || null,
      data.description || null,
      id,
    ],
  );

  return result.affectedRows > 0;
};

// Delete a database record
const deletePastQuestionFile = async (id) => {
  const [result] = await db.execute("DELETE FROM past_questions WHERE id = ?", [
    id,
  ]);

  return result.affectedRows > 0;
};

module.exports = {
  createPastQuestionFile,
  getPastQuestionFiles,
  getPastQuestionFileById,
  updatePastQuestionFile,
  deletePastQuestionFile,
};
