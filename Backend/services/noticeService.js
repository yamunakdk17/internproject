const noticeModel = require("../models/noticeModel");
const createError = require("../utils/error");

const ALLOWED_SECTORS = [
  "Administration",
  "Education",
  "Health",
  "IT",
  "Finance",
];

const ALLOWED_STATUSES = ["Open", "Closed", "Extended"];

// Keep HTML date input values as MySQL DATE strings; never parse them as JS dates.
const normalizeDate = (value, field) => {
  if (!value) return null;
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) throw createError(`${field} must be a valid YYYY-MM-DD date`, 400);
  const [, year, month, day] = match;
  const check = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (check.toISOString().slice(0, 10) !== value) {
    throw createError(`${field} must be a valid YYYY-MM-DD date`, 400);
  }
  return value;
};

// CREATE NOTICE
const createNotice = async (noticeData) => {
  if (!noticeData.title) {
    throw createError("Notice title is required", 400);
  }

  if (!noticeData.description) {
    throw createError("Notice description is required", 400);
  }

  if (!noticeData.sector) {
    throw createError("Notice sector is required", 400);
  }

  if (!ALLOWED_SECTORS.includes(noticeData.sector)) {
    throw createError("Invalid notice sector", 400);
  }

  const status = noticeData.status || "Open";

  if (!ALLOWED_STATUSES.includes(status)) {
    throw createError("Invalid notice status", 400);
  }

  const data = {
    title: noticeData.title,
    description: noticeData.description,
    sector: noticeData.sector,
    notice_type: noticeData.notice_type || null,
    organization: noticeData.organization || null,
    published_date: normalizeDate(noticeData.published_date, "Published date"),
    deadline: normalizeDate(noticeData.deadline, "Deadline"),
    status,
    notice_pdf: noticeData.notice_pdf || null,
    source_url: noticeData.source_url || null,
  };

  return await noticeModel.createNotice(data);
};

// GET ALL NOTICES
const getAllNotices = async () => {
  return await noticeModel.getAllNotices();
};

// GET NOTICES BY SECTOR
const getNoticesBySector = async (sector) => {
  if (!sector) {
    throw createError("Sector is required", 400);
  }

  if (!ALLOWED_SECTORS.includes(sector)) {
    throw createError("Invalid notice sector", 400);
  }

  return await noticeModel.getNoticesBySector(sector);
};

// GET SINGLE NOTICE
const getNoticeById = async (id) => {
  if (!id) {
    throw createError("Notice ID is required", 400);
  }

  const notice = await noticeModel.getNoticeById(id);

  if (!notice) {
    throw createError("Notice not found", 404);
  }

  return notice;
};

// UPDATE NOTICE
const updateNotice = async (id, noticeData) => {
  if (!id) {
    throw createError("Notice ID is required", 400);
  }

  if (!noticeData.title) {
    throw createError("Notice title is required", 400);
  }

  if (!noticeData.description) {
    throw createError("Notice description is required", 400);
  }

  if (!noticeData.sector) {
    throw createError("Notice sector is required", 400);
  }

  if (!ALLOWED_SECTORS.includes(noticeData.sector)) {
    throw createError("Invalid notice sector", 400);
  }

  const status = noticeData.status || "Open";

  if (!ALLOWED_STATUSES.includes(status)) {
    throw createError("Invalid notice status", 400);
  }

  const data = {
    title: noticeData.title,
    description: noticeData.description,
    sector: noticeData.sector,
    notice_type: noticeData.notice_type || null,
    organization: noticeData.organization || null,
    published_date: normalizeDate(noticeData.published_date, "Published date"),
    deadline: normalizeDate(noticeData.deadline, "Deadline"),
    status,
    notice_pdf: noticeData.notice_pdf || null,
    source_url: noticeData.source_url || null,
  };

  const result = await noticeModel.updateNotice(id, data);

  if (result.affectedRows === 0) {
    throw createError("Notice not found", 404);
  }

  return result;
};

// DELETE NOTICE
const deleteNotice = async (id) => {
  if (!id) {
    throw createError("Notice ID is required", 400);
  }

  const result = await noticeModel.deleteNotice(id);

  if (result.affectedRows === 0) {
    throw createError("Notice not found", 404);
  }

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
