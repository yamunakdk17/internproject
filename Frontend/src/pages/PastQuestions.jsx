import { useEffect, useState } from "react";

const API_BASE_URL = "http://localhost:5000";

const subjects = [
  "Administration",
  "General Knowledge",
  "Education",
  "Health",
  "Agriculture",
  "Engineering",
  "Finance",
  "IT",
];

const provinces = [
  "All provinces",
  "Koshi Province",
  "Madhesh Province",
  "Bagmati Province",
  "Gandaki Province",
  "Lumbini Province",
  "Karnali Province",
  "Sudurpashchim Province",
];

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+province$/i, "")
    .replace(/\s+/g, " ");

function PastQuestions() {
  const [subject, setSubject] = useState("Administration");
  const [province, setProvince] = useState("All provinces");
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPastQuestions = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(
          `${ API_BASE_URL }/api/admin/past-questions`
        );

        const result = await res.json();

        if (!res.ok || result.success === false) {
          throw new Error(
            result.message || "Failed to load past questions."
          );
        }

        const files = Array.isArray(result.data)
          ? result.data
          : Array.isArray(result.data?.papers)
            ? result.data.papers
            : [];

        setPapers(files);
      } catch (err) {
        setError(
          err.message || "Unable to connect to the server."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPastQuestions();
  }, []);

  // Apply both filters to the uploaded papers.
  const filtered = papers.filter((paper) => {
    const paperSubject = normalize(
      paper.subject ?? paper.category
    );

    const paperProvince = normalize(paper.province);

    const matchesSubject =
      subject === "All subjects" ||
      paperSubject === normalize(subject);

    const matchesProvince =
      province === "All provinces" ||
      paperProvince === normalize(province);

    return matchesSubject && matchesProvince;
  });


  const getFileUrl = (paper) => {
    if (!paper.file_name) return "#";

    return `${API_BASE_URL}/uploads/past-questions/${encodeURIComponent(
      paper.file_name
    )}`;
  };


  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date unavailable";
    }

    return parsedDate.toLocaleDateString();
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8 lg:py-12">
        <div>
          <p className="text-xs font-black uppercase tracking-[.16em] text-[#0874BD]">
            Paper library
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            Past questions, without the clutter.
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
            Browse and download past-question papers uploaded by the admin.
          </p>
        </div>

        {/* Subject and province filters */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <label>
              <span className="mb-2 block text-xs font-extrabold text-slate-500">
                Subject
              </span>

              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-[#0874BD]"
              >
                <option value="All subjects">All subjects</option>

                {subjects.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-2 block text-xs font-extrabold text-slate-500">
                Province
              </span>

              <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-[#0874BD]"
              >
                {provinces.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={() => {
                setSubject("All subjects");
                setProvince("All provinces");
              }}
              className="h-11 rounded-xl border border-slate-200 px-4 text-xs font-extrabold text-slate-600 hover:bg-slate-50"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Past-question files */}
        <div className="mt-6 grid gap-4">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
              Loading past-question files...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
              <p className="font-bold text-red-600">{error}</p>

              <p className="mt-2 text-sm text-slate-500">
                Check that your backend is running on port 5000.
              </p>
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((paper) => (
              <article
                key={paper.id ?? paper.file_name}
                className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-[#B9D9ED] hover:shadow-[0_14px_30px_rgba(24,34,53,.06)] sm:flex sm:items-center sm:justify-between sm:p-6"
              >
                <div className="flex items-start gap-4">
                  {/* File icon only */}
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#EAF4FB] text-2xl">
                    📄
                  </span>

                  <div>
                    <h2 className="break-all font-black text-[#182235]">
                      {paper.original_name || paper.file_name}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Uploaded: {formatDate(paper.created_at)}
                    </p>

                    <p className="mt-2 text-xs font-bold text-slate-400">
                      {paper.subject || paper.category || "Past question"}
                      {paper.province ? ` · ${paper.province} ` : ""}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2 sm:mt-0">
                  {paper.file_name ? (
                    <>
                      {/* View: open the paper in a new tab */}
                      <a
                        href={getFileUrl(paper)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl bg-[#0874BD] px-5 py-3 text-center text-xs font-extrabold text-red-500 hover:bg-[#78a9ce]"
                      >
                        <span className="text-white">Review</span>
                      </a>

                      {/* Download: download the actual file
                      <a
                        href={`${API_BASE_URL}/api/admin/past-questions/${paper.id}/download`}
                        className="rounded-xl border border-slate-200 px-4 py-3 text-center text-xs font-extrabold text-slate-600 hover:bg-slate-50"
                      >
                         
                      </a> */}
                    </>
                  ) : (
                    <span className="rounded-xl bg-slate-100 px-4 py-3 text-xs font-bold text-slate-500">
                      File unavailable
                    </span>
                  )}
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <p className="font-black">No past-question files found.</p>

              <p className="mt-1 text-sm text-slate-400">
                Try selecting another subject or province, or upload a paper
                through the admin section.
              </p>
            </div>
          )}
        </div>

        <p className="mt-6 text-xs leading-5 text-slate-400">
          Past-question files are provided for study and practice.
        </p>
      </div>
    </div>
  );
}

export default PastQuestions;
