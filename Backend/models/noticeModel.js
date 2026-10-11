const db = require("../config/db");

// Create notice
const createNotice = async (noticeData) => {
  const {
    title,
    description,
    sector,
    notice_type,
    organization,
    published_date,
    deadline,
    status,
    notice_pdf,
  } = noticeData;

  const sql = `
    INSERT INTO notices (
      title,
      description,
      sector,
      notice_type,
      organization,
      published_date,
      deadline,
      status,
      notice_pdf
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const [result] = await db.execute(sql, [
    title,
    description,
    sector,
    notice_type,
    organization,
    published_date,
    deadline,
    status,
    notice_pdf,
  ]);

  return result;
};

// Get all notices
const getAllNotices = async () => {
  const sql = `
    SELECT
      id,
      title,
      description,
      sector,
      notice_type,
      organization,
      DATE_FORMAT(published_date, '%Y-%m-%d') AS published_date,
      DATE_FORMAT(deadline, '%Y-%m-%d') AS deadline,
      status,
      notice_pdf,
      created_at
    FROM notices
    ORDER BY id DESC
  `;

  const [rows] = await db.execute(sql);

  return rows;
};

// Get notices by sector
const getNoticesBySector = async (sector) => {
  const sql = `
    SELECT
      id,
      title,
      description,
      sector,
      notice_type,
      organization,
      DATE_FORMAT(published_date, '%Y-%m-%d') AS published_date,
      DATE_FORMAT(deadline, '%Y-%m-%d') AS deadline,
      status,
      notice_pdf,
      created_at
    FROM notices
    WHERE sector = ?
    ORDER BY id DESC
  `;

  const [rows] = await db.execute(sql, [sector]);

  return rows;
};

// Get single notice by ID
const getNoticeById = async (id) => {
  const sql = `
    SELECT
      id,
      title,
      description,
      sector,
      notice_type,
      organization,
      DATE_FORMAT(published_date, '%Y-%m-%d') AS published_date,
      DATE_FORMAT(deadline, '%Y-%m-%d') AS deadline,
      status,
      notice_pdf,
      created_at
    FROM notices
    WHERE id = ?
  `;

  const [rows] = await db.execute(sql, [id]);

  return rows[0];
};

// Update notice
// Update notice
const updateNotice = async (id, noticeData) => {
  const {
    title,
    description,
    sector,
    notice_type,
    organization,
    published_date,
    deadline,
    status,
    notice_pdf,
  } = noticeData;

  let sql;
  let values;

  if (notice_pdf) {
    // Update notice + replace PDF
    sql = `
      UPDATE notices
      SET
        title = ?,
        description = ?,
        sector = ?,
        notice_type = ?,
        organization = ?,
        published_date = ?,
        deadline = ?,
        status = ?,
        notice_pdf = ?
      WHERE id = ?
    `;

    values = [
      title,
      description,
      sector,
      notice_type,
      organization,
      published_date,
      deadline,
      status,
      notice_pdf,
      id,
    ];
  } else {
    // Update notice details only
    // Keep existing PDF
    sql = `
      UPDATE notices
      SET
        title = ?,
        description = ?,
        sector = ?,
        notice_type = ?,
        organization = ?,
        published_date = ?,
        deadline = ?,
        status = ?
      WHERE id = ?
    `;

    values = [
      title,
      description,
      sector,
      notice_type,
      organization,
      published_date,
      deadline,
      status,
      id,
    ];
  }

  const [result] = await db.execute(sql, values);

  return result;
};
// Delete notice
const deleteNotice = async (id) => {
  const sql = `
    DELETE FROM notices
    WHERE id = ?
  `;

  const [result] = await db.execute(sql, [id]);

  return result;
};

module.exports = {
  createNotice,
  getAllNotices,
  getNoticesBySector,
  getNoticeById,
  updateNotice,
  deleteNotice,
};
