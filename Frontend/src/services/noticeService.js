const API_URL = "http://localhost:5000/api/notices";

const throwRequestError = (data, status, fallbackMessage) => {
  const error = new Error(data.message || fallbackMessage);
  error.status = status;
  throw error;
};

// Get all notices
export const getAllNotices = async () => {
  const response = await fetch(API_URL);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch notices");
  }

  return data;
};

// Get notices by sector
export const getNoticesBySector = async (sector) => {
  const response = await fetch(
    `${API_URL}/sector/${encodeURIComponent(sector)}`,
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch notices");
  }

  return data;
};

// Get single notice
export const getNoticeById = async (id) => {
  const response = await fetch(`${API_URL}/${id}`);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch notice");
  }

  return data;
};

// Create notice
export const createNotice = async (noticeData, token) => {
  const response = await fetch(`${API_URL}/create`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: noticeData,
  });

  const data = await response.json();

  if (!response.ok) {
    throwRequestError(data, response.status, "Failed to create notice");
  }

  return data;
};

// Update notice
export const updateNotice = async (id, noticeData, token) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: noticeData,
  });

  const data = await response.json();

  if (!response.ok) {
    throwRequestError(data, response.status, "Failed to update notice");
  }

  return data;
};

// Delete notice
export const deleteNotice = async (id, token) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throwRequestError(data, response.status, "Failed to delete notice");
  }

  return data;
};
