
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

function Dashboard() {
  const [progress, setProgress] = useState({
    summary: {
      totalAttempts: 0,
      averageAccuracy: 0,
      sectorsPracticed: 0,
      activeDays: 0,
    },
    attempts: [],
    weakestCategory: null,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  const firstName = user?.name?.split(" ")[0] || "Student";

  useEffect(() => {
    let cancelled = false;

    async function loadProgress() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/quiz-attempts");
        const data = response.data?.data;

        if (!data) {
          throw new Error("Unexpected progress response.");
        }

        if (!cancelled) {
          setProgress({
            summary: data.summary || {},
            attempts: Array.isArray(data.attempts)
              ? data.attempts
              : [],
            weakestCategory: data.weakestCategory || null,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
            "Unable to load your study progress."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProgress();

    return () => {
      cancelled = true;
    };
  }, []);

  const summary = progress.summary;
  const attempts = progress.attempts;

  const metrics = [
    [
      `${Number(summary.averageAccuracy || 0)}%`,
      "Average accuracy",
      "Across your saved quiz results",
    ],
    [
      Number(summary.totalAttempts || 0),
      "Quizzes attempted",
      "Completed and saved",
    ],
    [
      Number(summary.sectorsPracticed || 0),
      "Sectors practiced",
      "Different categories attempted",
    ],
  ];

  const weakest = progress.weakestCategory;

  function formatDate(value) {
    if (!value) return "Date unavailable";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid gap-6 lg:grid-cols-[230px_1fr]">
          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-3 lg:sticky lg:top-[94px]">
            <div className="mb-3 px-3 py-3">
              <p className="text-xs font-black uppercase tracking-[.15em] text-[#0874BD]">
                My study
              </p>
              <p className="mt-1 text-sm font-extrabold">
                Preparation desk
              </p>
            </div>

            {[
              ["Dashboard", "/dashboard", "▦"],
              ["Practice quiz", "/quiz", "◈"],
              ["Past questions", "/past-questions", "▤"],
            ].map(([label, path, icon], index) => (
              <Link
                key={path}
                to={path}
                className={`mb-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold ${index === 0
                    ? "bg-[#EAF4FB] text-[#07538E]"
                    : "text-slate-500 hover:bg-slate-50 hover:text-[#0874BD]"
                  }`}
              >
                <span className="w-5 text-center">{icon}</span>
                {label}
              </Link>
            ))}

            <div className="my-3 border-t border-slate-100" />

            <div className="rounded-xl bg-[#FFF9EA] p-3">
              <p className="text-xs font-black text-[#A56A00]">
                ACTIVE DAYS
              </p>
              <p className="mt-1 text-xl font-black text-[#182235]">
                {Number(summary.activeDays || 0)}
              </p>
              <p className="mt-1 text-[11px] leading-4 text-slate-500">
                Days with at least one saved quiz result.
              </p>
            </div>
          </aside>

          <main className="min-w-0">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-black uppercase tracking-[.16em] text-[#0874BD]">
                  Good to see you
                </p>
                <h1 className="mt-2 text-3xl font-black tracking-[-.03em] text-[#182235]">
                  Ready to study, {firstName}?
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Your study progress, based on your saved quiz results.
                </p>
              </div>

              <Link
                to="/quiz"
                className="inline-flex w-fit rounded-xl bg-[#0874BD] px-4 py-3 text-sm font-extrabold text-white hover:bg-[#07538E]"
              >
                Start a quiz →
              </Link>
            </div>

            {error && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-700">{error}</p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-2 text-sm font-bold text-red-800 underline"
                >
                  Try again
                </button>
              </div>
            )}

            <section className="mt-7 grid gap-4 sm:grid-cols-3">
              {metrics.map(([number, label, description]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-400">
                      {label}
                    </p>
                    <span className="h-2 w-2 rounded-full bg-[#0874BD]" />
                  </div>

                  <p className="mt-4 text-3xl font-black tracking-tight text-[#182235]">
                    {loading ? "—" : number}
                  </p>

                  <p className="mt-1 text-xs font-bold text-[#0874BD]">
                    {description}
                  </p>
                </div>
              ))}
            </section>

            <section className="mt-7 grid gap-5 xl:grid-cols-[1fr_300px]">
              <div className="rounded-2xl border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-100 p-5">
                  <div>
                    <h2 className="font-black">Recent attempts</h2>
                    <p className="mt-1 text-xs text-slate-400">
                      Your latest saved practice sessions
                    </p>
                  </div>

                  <Link
                    to="/quiz"
                    className="text-xs font-extrabold text-[#0874BD]"
                  >
                    Practice again
                  </Link>
                </div>

                {loading ? (
                  <p className="p-5 text-sm text-slate-500">
                    Loading your attempts...
                  </p>
                ) : attempts.length === 0 ? (
                  <div className="p-8 text-center">
                    <h3 className="font-bold text-slate-800">
                      No quiz attempts yet
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      Complete a quiz and your results will appear here.
                    </p>
                    <Link
                      to="/quiz"
                      className="mt-4 inline-block rounded-lg bg-[#0874BD] px-4 py-2 text-sm font-bold text-white"
                    >
                      Start your first quiz
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {attempts.slice(0, 5).map((attempt) => (
                      <div
                        key={attempt.id}
                        className="grid gap-3 p-5 sm:grid-cols-[1fr_120px_80px] sm:items-center"
                      >
                        <div>
                          <p className="text-sm font-extrabold text-[#182235]">
                            {attempt.quiz_title}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {formatDate(attempt.created_at)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {attempt.category}
                          </p>
                        </div>

                        <span className="text-sm font-bold text-slate-600">
                          {attempt.correct_answers} / {attempt.total_questions}
                        </span>

                        <span className="w-fit rounded-full bg-[#EAF7EF] px-2.5 py-1 text-xs font-black text-[#187A46]">
                          {Number(attempt.percentage || 0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-[#182235] p-6 text-white">
                <p className="text-xs font-black uppercase tracking-[.16em] text-[#FFAA0A]">
                  Next focus
                </p>

                <h2 className="mt-3 text-xl font-black">
                  {weakest?.category || "Start practicing"}
                </h2>

                <p className="mt-2 text-xs leading-5 text-slate-300">
                  {weakest
                    ? `Your average accuracy in this category is ${Number(weakest.averageAccuracy || 0)}%. Practice more questions to improve.`
                    : "Complete a quiz first. Your results will help identify which category needs more practice."}
                </p>

                {weakest && (
                  <div className="mt-6">
                    <div className="flex justify-between text-xs font-bold">
                      <span>Average accuracy</span>
                      <span>{Number(weakest.averageAccuracy || 0)}%</span>
                    </div>

                    <div className="mt-2 h-2 rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-[#FFAA0A]"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(0, Number(weakest.averageAccuracy || 0))
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                <Link
                  to="/quiz"
                  className="mt-6 block rounded-xl bg-white px-4 py-3 text-center text-xs font-extrabold text-[#182235]"
                >
                  Practice now
                </Link>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;