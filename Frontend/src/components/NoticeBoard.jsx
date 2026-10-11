import React, { useCallback, useEffect, useState } from "react";
import { getAllNotices } from "../services/noticeService";

const API_URL = "http://localhost:5000";

const tabs = [
  "All",
  "Administration",
  "Education",
  "Health",
  "IT",
  "Finance",
];

// Extract notice records from supported backend response formats.
function getRecords(result) {
  let payload = result?.data ?? result;

  if (payload?.success === false) {
    throw new Error(payload.message || "Failed to load notices.");
  }

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.notices)) return payload.notices;
  if (Array.isArray(payload?.records)) return payload.records;

  return [];
}

// Parse DATE columns as calendar days without applying the browser timezone.
function parseLocalDate(date) {
  if (!date) return null;

  const value = String(date).trim();

  // Preserve date-only values without timezone conversion.
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);

    const parsedDate = new Date(Date.UTC(year, month, day));

    if (
      parsedDate.getUTCFullYear() !== year ||
      parsedDate.getUTCMonth() !== month ||
      parsedDate.getUTCDate() !== day
    ) {
      return null;
    }

    return parsedDate;
  }

  return null;
}

function nepalToday(now) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kathmandu", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const date = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return new Date(Date.UTC(Number(date.year), Number(date.month) - 1, Number(date.day)));
}

// Format published dates relatively.
function formatDate(date, now = new Date()) {
  const parsedDate = parseLocalDate(date);

  if (!parsedDate) return "N/A";

  const publishedDay = new Date(Date.UTC(
    parsedDate.getUTCFullYear(),
    parsedDate.getUTCMonth(),
    parsedDate.getUTCDate()
  ));

  const today = new Date(Date.UTC(
    nepalToday(now).getUTCFullYear(),
    nepalToday(now).getUTCMonth(),
    nepalToday(now).getUTCDate()
  ));

  const daysAgo = Math.round(
    (today.getTime() - publishedDay.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  if (daysAgo < 0 || daysAgo >= 7) {
    return parsedDate.toLocaleDateString("en-GB", {
      timeZone: "UTC",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  if (daysAgo === 0) return "Today";
  if (daysAgo === 1) return "1 day ago";

  return `${daysAgo} days ago`;
}

// Calculate the deadline countdown.
function getDeadlineInfo(notice, now) {
  const status = String(notice.status || "")
    .trim()
    .toLowerCase();

  // An explicitly closed notice remains closed.
  if (status === "closed") {
    return {
      label: "Applications closed",
      className:
        "border-gray-300 bg-gray-100 text-gray-600",
    };
  }

  if (status !== "open" && status !== "extended") return null;

  const deadlineDate = parseLocalDate(notice.deadline);

  if (!deadlineDate) return null;

  const today = nepalToday(now);

  const deadline = deadlineDate;

  const difference = Math.round(
    (deadline.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  if (difference < 0) {
    return {
      label: "Deadline passed",
      className:
        "border-red-300 bg-red-50 text-red-700",
    };
  }

  if (difference === 0) {
    return {
      label: "Deadline today",
      className:
        "border-red-300 bg-red-50 text-red-700",
    };
  }

  if (difference === 1) {
    return {
      label: "1 day left",
      className:
        "border-amber-300 bg-amber-50 text-amber-700",
    };
  }

  return {
    label: `${difference} days left`,
    className:
      "border-green-300 bg-green-50 text-green-700",
  };
}

// Style status badges.
function getStatusClass(status) {
  switch (String(status || "").trim().toLowerCase()) {
    case "open":
      return "border border-green-300 bg-green-50 text-green-700";

    case "extended":
      return "border border-amber-300 bg-amber-50 text-amber-700";

    case "closed":
      return "border border-gray-300 bg-gray-100 text-gray-600";

    case "expired":
      return "border border-red-300 bg-red-50 text-red-700";

    default:
      return "border border-gray-300 bg-gray-50 text-gray-600";
  }
}

// Determine the status students should see.
function getDisplayStatus(notice, now) {
  const status = String(notice.status || "")
    .trim()
    .toLowerCase();

  // Explicitly closed notices remain closed.
  if (status === "closed") {
    return {
      label: "Closed",
      className: getStatusClass("closed"),
    };
  }

  const deadlineInfo = getDeadlineInfo(notice, now);

  // Show expired Open and Extended vacancies as closed without changing the API record.
  if (deadlineInfo?.label === "Deadline passed") {
    return {
      label: "Closed",
      className: getStatusClass("expired"),
    };
  }

  return {
    label: notice.status || "Unknown",
    className: getStatusClass(notice.status),
  };
}

// Resolve uploaded PDF paths and official URLs.
function getPdfUrl(notice) {
  const filePath =
    notice.notice_pdf ||
    notice.pdf_path ||
    notice.file_path;

  const officialUrl = notice.source_url;
  const value = filePath || officialUrl;

  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const url = value.trim();

  // Allow HTTP and HTTPS links.
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  // Reject unsupported URL schemes.
  if (/^[a-z][a-z\d+.-]*:/i.test(url)) {
    return null;
  }

  // Convert relative paths into backend URLs.
  return `${API_URL}/${url.replace(/^\/+/, "")}`;
}

function NoticeBoard() {
  const [notices, setNotices] = useState([]);
  const [activeTab, setActiveTab] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => new Date());

  // Update the current date every minute.
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60 * 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch real notices from the backend.
  const fetchNotices = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getAllNotices();
      const records = getRecords(result);

      setNotices(records);
    } catch (err) {
      console.error("Failed to fetch notices:", err);
      console.error("Backend response:", err.response?.data);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load notices. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  // Filter by sector and sort notices.
  const filteredNotices = notices
    .filter((notice) => {
      if (activeTab === "All") return true;

      return (
        String(notice.sector || "")
          .trim()
          .toLowerCase() === activeTab.toLowerCase()
      );
    })
    .sort((a, b) => {
      const getPriority = (notice) => {
        const status = String(notice.status || "")
          .trim()
          .toLowerCase();

        if (status === "closed") return 3;

        const deadlineInfo = getDeadlineInfo(notice, now);

        if (deadlineInfo?.label === "Deadline passed") {
          return 2;
        }

        if (status === "extended") return 1;
        if (status === "open") return 0;

        return 4;
      };

      return getPriority(a) - getPriority(b);
    });

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-3xl font-bold text-[#182235]">
              Notice Board
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Latest notices and announcements
            </p>
          </div>

          <button
            type="button"
            onClick={fetchNotices}
            disabled={loading}
            className="rounded-full border border-gray-300 px-5 py-2 text-sm font-semibold text-[#182235] hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Sector tabs */}
        <div className="mt-6 flex flex-wrap gap-x-7 gap-y-3 border-b border-gray-200">
          {tabs.map((tab) => {
            const isActive = activeTab === tab;

            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`border-b-2 px-1 pb-4 text-sm font-semibold transition ${
                  isActive
                    ? "border-[#1769AA] text-[#182235]"
                    : "border-transparent text-gray-500 hover:text-[#1769AA]"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Loading */}
        {loading && (
          <div className="py-12 text-center text-gray-500">
            Loading notices...
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div
            role="alert"
            className="mt-6 rounded-lg border border-red-200 bg-red-50 p-5 text-center text-red-700"
          >
            <p>{error}</p>

            <button
              type="button"
              onClick={fetchNotices}
              className="mt-3 font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Notice list */}
        {!loading && !error && (
          <div className="mt-6 space-y-5">
            {filteredNotices.map((notice, index) => {
              const vacancyUrl = getPdfUrl(notice);
              const deadlineInfo = getDeadlineInfo(notice, now);
              const displayStatus = getDisplayStatus(notice, now);


              return (
                <article
                  key={notice.id ?? notice._id ?? index}
                  className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    {/* Notice details */}
                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex flex-wrap gap-2">
                        {notice.sector && (
                          <span className="rounded-full border border-[#B9D9F5] bg-[#EEF7FF] px-3 py-1 text-xs font-semibold text-[#0874BD]">
                            {notice.sector}
                          </span>
                        )}

                        {notice.notice_type && (
                          <span className="rounded-full border border-gray-300 bg-gray-50 px-3 py-1 text-xs font-semibold uppercase text-gray-500">
                            {notice.notice_type}
                          </span>
                        )}

                        {/* Status badge */}
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${displayStatus.className}`}
                        >
                          {displayStatus.label}
                        </span>
                      </div>

                      <h3 className="break-words text-xl font-bold text-[#303B4C]">
                        {notice.title || "Untitled notice"}
                      </h3>

                      {notice.organization && (
                        <p className="mt-2 text-sm font-semibold text-gray-600">
                          {notice.organization}
                        </p>
                      )}

                      {notice.description && (
                        <p className="mt-3 whitespace-pre-line break-words text-sm leading-6 text-gray-500">
                          {notice.description}
                        </p>
                      )}

                      {/* Published date, deadline and source */}
                      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
                        <div>
                          <span className="font-semibold text-[#303B4C]">
                            Published:
                          </span>{" "}
                          {formatDate(notice.published_date, now)}
                        </div>

                        <div>
                          <span className="font-semibold text-[#303B4C]">
                            Deadline:
                          </span>{" "}
                          <span className={deadlineInfo?.label === "Deadline passed" ? "font-semibold text-red-700" : ""}>
                            {deadlineInfo?.label || (notice.deadline ? formatDate(notice.deadline, now) : "No deadline")}
                          </span>
                        </div>

                        {notice.source_name && (
                          <div>
                            <span className="font-semibold text-[#303B4C]">
                              Source:
                            </span>{" "}
                            {notice.source_name}
                          </div>
                        )}
                      </div>


                    </div>

                    {/* Vacancy PDF / official website */}
                    <div className="flex flex-shrink-0 flex-wrap gap-2">
                      {vacancyUrl ? (
                        <a
                          href={vacancyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block rounded-lg bg-[#0874BD] px-5 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-[#0767AA]"
                        >
                          Open Vacancy
                        </a>
                      ) : (
                        <span className="rounded-lg bg-gray-100 px-5 py-2.5 text-center text-sm font-semibold text-gray-500">
                          Vacancy Link Not Available
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}

            {/* Empty state */}
            {filteredNotices.length === 0 && (
              <div className="rounded-lg border border-gray-200 py-12 text-center text-gray-500">
                <p className="font-semibold text-[#303B4C]">
                  No notices available
                </p>

                <p className="mt-1 text-sm">
                  {activeTab === "All"
                    ? "No notices have been returned by the server."
                    : `No notices found for ${activeTab}.`}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default NoticeBoard;
