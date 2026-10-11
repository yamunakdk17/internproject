
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const API_SERVER_URL = API_BASE_URL.replace(/\/api\/?$/, "");

const sectors = [
  ["Administration", "प्रशासन"],
  ["General Knowledge", "सामान्य ज्ञान"],
  ["Education", "शिक्षा"],
  ["Health", "स्वास्थ्य"],
  ["IT", "सूचना प्रविधि"],
  ["Finance", "वित्त"],
];

function getRecords(response) {
  if (Array.isArray(response)) return response;

  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.questions)) return data.questions;
  if (Array.isArray(data?.notices)) return data.notices;
  if (Array.isArray(data?.records)) return data.records;
  if (Array.isArray(response?.questions)) return response.questions;
  if (Array.isArray(response?.notices)) return response.notices;

  return [];
}

function getVacancyUrl(notice) {
  const filePath =
    notice.notice_pdf ||
    notice.pdf_path ||
    notice.file_path;

  const value = filePath || notice.source_url;

  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const url = value.trim();

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  // Reject unsupported URL schemes.
  if (/^[a-z][a-z\d+.-]*:/i.test(url)) {
    return null;
  }

  // Resolve a relative file path against the backend server.
  return `${API_SERVER_URL}/${url.replace(/^\/+/, "")}`;
}

function getDueLabel(notice, now) {
  const status = String(notice.status || "").trim().toLowerCase();
  if (status === "closed") return "Closed";
  if (!notice.deadline) return "No deadline";
  if (status !== "open" && status !== "extended") {
    return `Due ${String(notice.deadline).slice(0, 10)}`;
  }

  const match = String(notice.deadline).slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "No deadline";
  const [, year, month, day] = match.map(Number);
  const deadline = Date.UTC(year, month - 1, day);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kathmandu", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const todayParts = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const today = Date.UTC(Number(todayParts.year), Number(todayParts.month) - 1, Number(todayParts.day));
  const daysLeft = Math.round((deadline - today) / 86400000);

  if (daysLeft < 0) return "Deadline passed";
  if (daysLeft === 0) return "Due today";
  return `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`;
}

function Arrow() {
  return <span aria-hidden="true">→</span>;
}

function Home() {
  const [notices, setNotices] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loadingNotices, setLoadingNotices] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [noticeError, setNoticeError] = useState("");
  const [questionError, setQuestionError] = useState("");
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadNotices() {
      try {
        setNoticeError("");

        const response = await fetch(`${API_BASE_URL}/notices`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Notices request failed (${response.status})`);
        }

        const result = await response.json();
        const records = getRecords(result);

        console.log("HOME NOTICE RECORDS:", records);

        setNotices(records);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Failed to load notices:", error);
          setNoticeError(error.message || "Unable to load notices.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingNotices(false);
        }
      }
    }

    async function loadQuestions() {
      try {
        setQuestionError("");

        const response = await fetch(`${API_BASE_URL}/questions/get`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Questions request failed (${response.status})`);
        }

        const result = await response.json();
        setQuestions(getRecords(result));
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Failed to load questions:", error);
          setQuestionError(error.message || "Unable to load questions.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingQuestions(false);
        }
      }
    }

    loadNotices();
    loadQuestions();

    return () => controller.abort();
  }, []);

  function getSectorCount(sectorName) {
    if (loadingQuestions || questionError) return null;

    return questions.filter((question) => {
      const category = String(
        question.category || question.sector || ""
      ).trim().toLowerCase();

      const subject = String(question.subject || "")
        .trim()
        .toLowerCase();

      const sector = sectorName.toLowerCase();

      if (sectorName === "General Knowledge") {
        return (
          category.includes("general knowledge") ||
          category === "gk" ||
          subject.includes("general knowledge") ||
          subject === "gk"
        );
      }

      if (sectorName === "IT") {
        return (
          category === "it" ||
          category.includes("information technology") ||
          subject === "it" ||
          subject.includes("information technology")
        );
      }

      return category === sector || subject === sector;
    }).length;
  }

  return (
    <div className="pb-16">
      {/* HERO SECTION */}
      <section className="app-grid border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[1.08fr_.92fr] lg:px-8 lg:py-20">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#CDE5F4] bg-[#F2F9FD] px-3 py-1.5 text-xs font-extrabold text-[#07538E]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FFAA0A]" />
              Loksewa preparation desk
            </div>

            <h1 className="text-4xl font-black tracking-[-.045em] text-[#182235] sm:text-5xl lg:text-[58px] lg:leading-[1.04]">
              Your daily practice,{" "}
              <span className="text-[#0874BD]">made simple.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-slate-500 sm:text-lg">
              Stop searching for what to study next. Pick a sector, solve a
              focused quiz, review your mistakes and keep your preparation
              moving.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/quiz"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0874BD] px-5 py-3.5 text-sm font-extrabold text-white shadow-[0_10px_25px_rgba(8,116,189,.2)] hover:bg-[#07538E]"
              >
                Start a practice quiz <Arrow />
              </Link>

              <Link
                to="/past-questions"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-extrabold text-[#182235] hover:border-[#B9D9ED] hover:bg-[#F7FBFE]"
              >
                Browse past questions
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-xs font-bold text-slate-400">
              <span>✓ Sector-wise practice</span>
              <span>✓ Instant explanations</span>
              <span>✓ Progress tracking</span>
            </div>
          </div>

          {/* QUIZ PREVIEW */}
          <div className="relative flex items-end justify-center lg:justify-end">
            <div className="w-full max-w-[480px] rounded-[28px] border border-[#CFE3EF] bg-[#F4FAFD] p-4 shadow-[0_24px_60px_rgba(24,34,53,.09)]">
              <div className="rounded-[22px] bg-[#0874BD] p-6 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold text-blue-100">
                      TODAY'S FOCUS
                    </p>
                    <h2 className="mt-2 text-2xl font-black">
                      Administration
                    </h2>
                  </div>

                  <span className="rounded-lg bg-white/15 px-2.5 py-1 text-xs font-bold">
                    15 Q
                  </span>
                </div>

                <div className="mt-7 rounded-2xl bg-white p-4 text-[#182235]">
                  <p className="text-xs font-bold text-slate-400">
                    QUESTION 01
                  </p>

                  <p className="mt-2 text-sm font-bold leading-6">
                    Which principle best supports accountable public
                    administration?
                  </p>

                  <div className="mt-4 space-y-2">
                    {[
                      "Transparency",
                      "Secrecy",
                      "Delay",
                      "Exclusion",
                    ].map((option, index) => (
                      <div
                        key={option}
                        className={`rounded-xl border px-3 py-2.5 text-xs font-bold ${index === 0
                            ? "border-[#0874BD] bg-[#EAF4FB] text-[#07538E]"
                            : "border-slate-100 text-slate-500"
                          }`}
                      >
                        <span className="mr-2 text-slate-300">
                          {String.fromCharCode(65 + index)}
                        </span>
                        {option}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs font-bold text-blue-100">
                  <span>4 / 15 completed</span>
                  <span>12 min left</span>
                </div>

                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/20">
                  <div className="h-full w-[27%] rounded-full bg-[#FFAA0A]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTOR-WISE PRACTICE */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[.16em] text-[#0874BD]">
              Choose your lane
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-[#182235]">
              Practice by sector
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Jump straight into the subject you are preparing for.
            </p>
          </div>

          <Link to="/quiz" className="text-sm font-extrabold text-[#0874BD]">
            View all quizzes →
          </Link>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sectors.map(([name, nepali], index) => (
            <Link
              to="/quiz"
              key={name}
              className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#B9D9ED] hover:shadow-[0_14px_30px_rgba(24,34,53,.07)]"
            >
              <div className="flex items-start justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#EAF4FB] text-sm font-black text-[#0874BD]">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <span className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#0874BD]">
                  ↗
                </span>
              </div>

              <h3 className="mt-5 font-extrabold text-[#182235]">{name}</h3>
              <p className="mt-1 text-sm text-slate-400">{nepali}</p>

              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-bold text-slate-400">
                <span>
                  {loadingQuestions
                    ? "Loading questions..."
                    : questionError
                      ? "Question count unavailable"
                      : `${getSectorCount(name)} questions`}
                </span>

                <span className="text-[#0874BD]">Practice →</span>
              </div>
            </Link>
          ))}
        </div>

        {questionError && (
          <p className="mt-4 text-sm text-slate-500">
            Question counts are unavailable. You can still browse the practice
            section.
          </p>
        )}
      </section>

      {/* STUDY ROUTINE AND PAST QUESTIONS */}
      <section className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[1.15fr_.85fr] lg:px-8">
        <div className="rounded-3xl bg-[#182235] p-7 text-white sm:p-9">
          <p className="text-xs font-black uppercase tracking-[.16em] text-[#FFAA0A]">
            Build your routine
          </p>

          <h2 className="mt-3 max-w-lg text-3xl font-black tracking-tight">
            A better way to spend your 30 minutes.
          </h2>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {[
              ["01", "Pick", "One focused sector"],
              ["02", "Solve", "15 timed questions"],
              ["03", "Review", "Learn from mistakes"],
            ].map(([number, title, description]) => (
              <div
                key={number}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <span className="text-xs font-black text-[#FFAA0A]">
                  {number}
                </span>
                <p className="mt-4 font-extrabold">{title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-7 sm:p-9">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[.16em] text-[#0874BD]">
                Quick access
              </p>
              <h2 className="mt-2 text-2xl font-black">Past questions</h2>
            </div>

            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#FFF5DC] font-black text-[#D88B00]">
              ↗
            </span>
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-500">
            Filter papers by subject, province and exam date instead of
            scrolling through a long list.
          </p>

          <Link
            to="/past-questions"
            className="mt-7 inline-flex rounded-xl bg-[#0874BD] px-4 py-3 text-sm font-extrabold text-white hover:bg-[#07538E]"
          >
            Open paper library
          </Link>
        </div>
      </section>

      {/* NOTICE BOARD */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[.16em] text-[#0874BD]">
                Notice board
              </p>
              <h2 className="mt-2 text-2xl font-black">
                Important updates
              </h2>
            </div>

            <span className="text-xs font-bold text-slate-400">
              Latest first
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {loadingNotices ? (
              <p className="p-5 text-sm text-slate-500">
                Loading notices...
              </p>
            ) : noticeError ? (
              <div className="p-5">
                <p className="text-sm text-slate-500">
                  Unable to load notices. Check that the backend is running
                  and the API URL is correct.
                </p>

                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-2 text-sm font-bold text-[#0874BD]"
                >
                  Try again
                </button>
              </div>
            ) : notices.length === 0 ? (
              <p className="p-5 text-sm text-slate-500">
                No notices have been published yet.
              </p>
            ) : (
              notices.map((notice, index) => {
                const originalStatus = String(notice.status || "Published");
                const dueLabel = getDueLabel(notice, now);
                const expired = dueLabel === "Deadline passed" &&
                  ["open", "extended"].includes(originalStatus.trim().toLowerCase());
                const status = expired ? "Closed" : originalStatus;
                const isOpen = status.toLowerCase() === "open";
                const vacancyUrl = getVacancyUrl(notice);

                return (
                  <div
                    key={notice.id ?? notice._id ?? index}
                    className="grid gap-3 p-5 sm:grid-cols-[150px_1fr_100px_auto] sm:items-center"
                  >
                    <span className="text-xs font-extrabold text-[#0874BD]">
                      {notice.sector || notice.category || "General"}
                    </span>

                    <div>
                      <p className="text-sm font-extrabold text-[#182235]">
                        {notice.title || "Untitled notice"}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {notice.organization || notice.description || ""}
                      </p>
                    </div>

                    <span className={`text-xs font-bold ${expired ? "text-red-700" : "text-slate-500"}`}>
                      {dueLabel}
                    </span>

                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-black ${
                          isOpen
                            ? "bg-[#EAF7EF] text-[#187A46]"
                            : status.toLowerCase() === "closed"
                              ? "bg-slate-100 text-slate-600"
                              : "bg-[#FFF5DC] text-[#A56A00]"
                        }`}
                      >
                        {status}
                      </span>

                      {vacancyUrl ? (
                        <a
                          href={vacancyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-lg bg-[#0874BD] px-3 py-2 text-xs font-extrabold text-white hover:bg-[#07538E]"
                        >
                          <span className="text-white">Open Vacancy</span>
                           
                        </a>
                      ) : (
                        <span
                          title="The backend did not return a vacancy PDF path or official URL."
                          className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500"
                        >
                          Link unavailable
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
