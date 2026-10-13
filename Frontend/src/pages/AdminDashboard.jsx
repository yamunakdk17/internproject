import { useEffect, useState } from "react";
import api from "../api/axios"; 
import AdminTabs from "../components/admin/AdminTabs";
import PastQuestionSection from "../components/admin/PastQuestionSection";
import QuestionSection from "../components/admin/questionSection"; 
import Questionbank from "../components/admin/Questionbank";
import NoticeBoardSection from "../components/admin/NoticeBoardSection";
import UserManagement from "../components/admin/UserManagement";

const modules = [
  ["past", "Past questions", "Build paper library"],
  ["quiz", "Practice quizzes", "Create MCQs"],
  ["questionbank", "Question bank", "Review question pool"],
  ["notice", "Notice board", "Publish updates"],
  ["users","User management","View students and manage roles"],
];

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("past");
  const [toast, setToast] = useState("");

  const [stats, setStats] = useState({
    pastPapers: null,
    questions: null,
    openNotices: null,
  });

  useEffect(() => {
    const getRecords = (response) => {
      const result = response?.data;

      if (Array.isArray(result)) return result;
      if (Array.isArray(result?.data)) return result.data;
      if (Array.isArray(result?.data?.records)) return result.data.records;
      if (Array.isArray(result?.data?.questions)) return result.data.questions;
      if (Array.isArray(result?.data?.notices)) return result.data.notices;
      if (Array.isArray(result?.data?.papers)) return result.data.papers;

      return [];
    };

    const loadStats = async () => {
      const [papersResult, questionsResult, noticesResult] =
        await Promise.allSettled([
          api.get("/admin/past-questions"),
          api.get("/questions/get"),
          api.get("/notices"),
        ]);

      setStats({
        pastPapers:
          papersResult.status === "fulfilled"
            ? getRecords(papersResult.value).length
            : null,

        questions:
          questionsResult.status === "fulfilled"
            ? getRecords(questionsResult.value).length
            : null,

        openNotices:
          noticesResult.status === "fulfilled"
            ? getRecords(noticesResult.value).filter(
              (notice) =>
                String(notice.status || "").toLowerCase() === "open"
            ).length
            : null,
      });
    };

    loadStats();
  }, []);

  const showToast = (message) => {
    setToast(message);
    window.clearTimeout(window.__lqToast);
    window.__lqToast = window.setTimeout(() => setToast(""), 3000);
  };

  const active = modules.find(([id]) => id === activeTab);

  return (
    <div className="min-h-screen bg-[#F6F9FC]">
      <div className="border-b border-slate-200 bg-[#182235] text-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#0874BD] text-xs font-black">
              LQ
            </span>
            <div>
              <p className="text-[15px] font-extrabold">Loksewa Quiz</p>
              <p className="text-[10px] font-bold uppercase tracking-[.15em] text-slate-400">
                Admin workspace
              </p>
            </div>
          </div>
          <a
            href="/"
            className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-extrabold text-slate-300 hover:bg-white/5 hover:text-white"
          >
            View student site ↗
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mb-7">
          <p className="text-xs font-black uppercase tracking-[.16em] text-[#0874BD]">
            Content control centre
          </p>
          <div className="mt-2 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-[#182235]">
                Good morning, admin.
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Manage the content students see. Each workspace keeps one task
                in focus.
              </p>
            </div>
            <div className="text-xs font-bold text-slate-400">
              Content status{" "}
              <span className="ml-1 text-[#187A46]">● All systems ready</span>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            [
              stats.pastPapers,
              "Past question papers",
              "Uploaded papers available in the library",
            ],
            [
              stats.questions,
              "Question records",
              "Questions returned by the backend",
            ],
            [stats.openNotices, "Open notices", "Notices with Open status"],
          ].map(([count, label, description]) => (
            <div
              key={label}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <p className="text-3xl font-black text-[#182235]">
                {count === null ? "—" : count}
              </p>

              <p className="mt-1 text-sm font-extrabold">{label}</p>

              <p className="mt-1 text-xs text-slate-400">{description}</p>
            </div>
          ))}
        </div>

        <div className="mt-7 grid gap-6 lg:grid-cols-[235px_1fr]">
          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-2 lg:sticky lg:top-6">
            <p className="px-3 py-3 text-[10px] font-black uppercase tracking-[.16em] text-slate-400">
              Workspace
            </p>
            {modules.map(([id, label, desc]) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`mb-1 w-full rounded-xl p-3 text-left transition ${activeTab === id ? "bg-[#EAF4FB] text-[#07538E]" : "text-slate-600 hover:bg-slate-50"}`}
              >
                <span className="block text-sm font-extrabold">{label}</span>
                <span
                  className={`mt-1 block text-[10px] ${activeTab === id ? "text-[#0874BD]" : "text-slate-400"}`}
                >
                  {desc}
                </span>
              </button>
            ))}
            <div className="mt-3 rounded-xl bg-[#FFF9EA] p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#A56A00]">
                Design note
              </p>
              <p className="mt-2 text-[11px] leading-5 text-slate-500">
                Forms stay spacious and grouped so content entry is faster on
                desktop and tablet.
              </p>
            </div>
          </aside>

          <section className="min-w-0">
            <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-black uppercase tracking-[.16em] text-[#0874BD]">
                    Current workspace
                  </p>
                  <h2 className="mt-1 text-xl font-black text-[#182235]">
                    {active?.[1]}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">{active?.[2]}.</p>
                </div>
                <span className="w-fit rounded-full bg-[#EAF7EF] px-3 py-1.5 text-[11px] font-black text-[#187A46]">
                  ● Active
                </span>
              </div>
            </div>
            <div className="[&>div]:!rounded-2xl [&>div]:!border-slate-200 [&>div]:!shadow-none">
              {activeTab === "past" && (
                <PastQuestionSection showToast={showToast} />
              )}
              {activeTab === "quiz" && (
                <QuestionSection showToast={showToast} />
              )}
              {activeTab === "questionbank" && (
                <Questionbank showToast={showToast} />
              )}
              {activeTab === "notice" && (
                <NoticeBoardSection showToast={showToast} />
              )}
              {activeTab === "users" && (
                <UserManagement showToast={showToast} />
              )}
            </div>
          </section>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-xl bg-[#182235] px-5 py-3 text-sm font-bold text-white shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
}
export default AdminDashboard;
