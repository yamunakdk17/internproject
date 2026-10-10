
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const API_URL = "http://localhost:5000/api/questions/get";
const LETTERS = ["A", "B", "C", "D"];
const NEGATIVE_MARK = 0.2;

const NEPALI_CATEGORIES = {
  Administration: "प्रशासन",
  Education: "शिक्षा",
  "General Knowledge": "सामान्य ज्ञान",
  Health: "स्वास्थ्य",
  IT: "सूचना प्रविधि",
  Finance: "वित्त",
  Agriculture: "कृषि",
  Engineering: "इन्जिनियरिङ",
};

function Quiz() {
  const [allQuestions, setAllQuestions] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [saved, setSaved] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch quiz questions from the backend.
  useEffect(() => {
    const controller = new AbortController();

    async function fetchQuestions() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(API_URL, {
          signal: controller.signal,
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || "Unable to load questions from the backend."
          );
        }


        const rows = Array.isArray(result)
          ? result
          : Array.isArray(result.questions)
            ? result.questions
            : Array.isArray(result.data?.questions)
              ? result.data.questions
              : Array.isArray(result.data)
                ? result.data
                : [];

        if (!Array.isArray(rows)) {
          throw new Error("The backend returned an unexpected response.");
        }
        


        const formatted = rows
          .filter((item) => {
            const type = String(item.question_type || "MCQ").toUpperCase();
            return type === "MCQ";
          })
          .map((item) => {
            const correctLetter = String(
              item.correct_answer || ""
            ).trim().toUpperCase();

            return {
              id: item.id,
              category: String(item.category || "").trim(),
              subject: item.subject || "",
              province: item.province || "",
              examDate: item.exam_date || null,
              difficulty: item.difficulty || "Medium",
              question: item.question_text || "",
              options: [
                item.option_a,
                item.option_b,
                item.option_c,
                item.option_d,
              ],
              answer: LETTERS.indexOf(correctLetter),
              explanation: item.explanation || "",
            };
          })
          .filter(
            (item) =>
              item.id !== null &&
              item.id !== undefined &&
              item.category &&
              item.question &&
              item.options.every(
                (option) =>
                  option !== null &&
                  option !== undefined &&
                  String(option).trim() !== ""
              ) &&
              item.answer >= 0
          );

        setAllQuestions(formatted);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(
            err.message || "Could not connect to the backend server."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchQuestions();

    return () => controller.abort();
  }, []);

  // Generate the category cards from database records.
  const quizzes = useMemo(() => {
    const groups = new Map();

    allQuestions.forEach((question) => {
      if (!groups.has(question.category)) {
        groups.set(question.category, []);
      }

      groups.get(question.category).push(question);
    });

    return Array.from(groups, ([name, questions]) => ({
      name,
      nepali: NEPALI_CATEGORIES[name] || "",
      questions,
    }));
  }, [allQuestions]);

  const questions = activeQuiz?.questions || [];
  const question = questions[current];

  const answeredCount = Object.keys(answers).filter((id) =>
    questions.some(
      (item) => String(item.id) === String(id)
    )
  ).length;

  const correctCount = questions.filter(
    (item) => answers[item.id] === item.answer
  ).length;

  const wrongCount = questions.filter(
    (item) =>
      answers[item.id] !== undefined &&
      answers[item.id] !== item.answer
  ).length;

  const unansweredCount = questions.length - answeredCount;
  const score = correctCount - wrongCount * NEGATIVE_MARK;
  const percentage = questions.length
    ? Math.round((Math.max(0, score) / questions.length) * 100)
    : 0;

  const displayedQuestions = showSavedOnly
    ? questions.filter((item) => saved.includes(item.id))
    : questions;

  function startQuiz(quiz) {
    if (!quiz.questions.length) return;

    setActiveQuiz(quiz);
    setCurrent(0);
    setAnswers({});
    setSaved([]);
    setSubmitted(false);
    setShowSavedOnly(false);
  }

  function chooseAnswer(optionIndex) {
    if (submitted || !question) return;

    setAnswers((previous) => ({
      ...previous,
      [question.id]: optionIndex,
    }));
  }

  function toggleSaved() {
    if (!question) return;

    setSaved((previous) =>
      previous.includes(question.id)
        ? previous.filter((id) => id !== question.id)
        : [...previous, question.id]
    );
  }

  function submitQuiz() {
    if (!questions.length) return;

    const message = unansweredCount
      ? `You have ${ unansweredCount } unanswered question(s).Submit anyway ? `
      : "Are you sure you want to submit the quiz?";

    if (window.confirm(message)) {
      setSubmitted(true);
      setShowSavedOnly(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function backToSubjects() {
    setActiveQuiz(null);
    setCurrent(0);
    setAnswers({});
    setSaved([]);
    setSubmitted(false);
    setShowSavedOnly(false);
  }

  function goToQuestion(index) {
    if (index < 0 || index >= questions.length) return;
    setCurrent(index);
  }

  // Loading and error states.
  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#0874BD]" />
          <p className="text-slate-600">
            Loading quizzes from the database...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-white p-8 text-center">
          <h2 className="text-xl font-bold text-slate-800">
            Unable to load quizzes
          </h2>
          <p className="mt-3 break-words text-sm text-red-600">
            {error}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-lg bg-[#0874BD] px-5 py-3 font-semibold text-white hover:opacity-90"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  // Quiz results.
  if (activeQuiz && submitted) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-4xl">
          <button
            type="button"
            onClick={backToSubjects}
            className="mb-6 text-sm font-semibold text-[#0874BD] hover:underline"
          >
            ← Back to quizzes
          </button>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Quiz completed
              </p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">
                {activeQuiz.name} Results
              </h1>

              <div className="mx-auto my-7 flex h-32 w-32 flex-col items-center justify-center rounded-full border-8 border-[#0874BD]/15">
                <span className="text-3xl font-bold text-[#0874BD]">
                  {percentage}%
                </span>
                <span className="text-xs text-slate-500">Score</span>
              </div>

              <p className="text-slate-600">
                Net score: {Math.max(0, score).toFixed(2)} / {questions.length}
              </p>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-xl bg-slate-50 p-4 text-center">
                <p className="text-2xl font-bold text-slate-900">
                  {questions.length}
                </p>
                <p className="text-sm text-slate-500">Total</p>
              </div>
              <div className="rounded-xl bg-green-50 p-4 text-center">
                <p className="text-2xl font-bold text-green-700">
                  {correctCount}
                </p>
                <p className="text-sm text-green-700">Correct</p>
              </div>
              <div className="rounded-xl bg-red-50 p-4 text-center">
                <p className="text-2xl font-bold text-red-700">
                  {wrongCount}
                </p>
                <p className="text-sm text-red-700">Wrong</p>
              </div>
              <div className="rounded-xl bg-amber-50 p-4 text-center">
                <p className="text-2xl font-bold text-amber-700">
                  {unansweredCount}
                </p>
                <p className="text-sm text-amber-700">Unanswered</p>
              </div>
            </div>

            <div className="mt-10">
              <h2 className="mb-5 text-xl font-bold text-slate-900">
                Answer Review
              </h2>

              <div className="space-y-5">
                {questions.map((item, index) => {
                  const selected = answers[item.id];
                  const isCorrect = selected === item.answer;

                  return (
                    <article
                      key={item.id}
                      className="rounded-xl border border-slate-200 p-5"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold">
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900">
                            {item.question}
                          </p>

                          <div className="mt-3 space-y-2">
                            {item.options.map((option, optionIndex) => {
                              const isAnswer = optionIndex === item.answer;
                              const isSelected = optionIndex === selected;

                              return (
                                <div
                                  key={optionIndex}
                                  className={`rounded - lg border p - 3 text - sm ${
          isAnswer
            ? "border-green-300 bg-green-50 text-green-800"
            : isSelected
              ? "border-red-300 bg-red-50 text-red-800"
              : "border-slate-200 text-slate-600"
        } `}
                                >
                                  <span className="mr-2 font-bold">
                                    {LETTERS[optionIndex]}.
                                  </span>
                                  {option}
                                  {isAnswer && (
                                    <span className="ml-2 font-semibold">
                                      Correct answer
                                    </span>
                                  )}
                                  {isSelected && !isAnswer && (
                                    <span className="ml-2 font-semibold">
                                      Your answer
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {selected === undefined && (
                            <p className="mt-3 text-sm text-amber-700">
                              You did not answer this question.
                            </p>
                          )}

                          {selected !== undefined && (
                            <p
                              className={`mt - 3 text - sm font - semibold ${
          isCorrect ? "text-green-700" : "text-red-700"
        } `}
                            >
                              {isCorrect
                                ? "Correct"
                                : `Incorrect · ${ NEGATIVE_MARK } mark deducted`}
                            </p>
                          )}

                          {item.explanation && (
                            <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                              <strong>Explanation:</strong>{" "}
                              {item.explanation}
                            </p>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={backToSubjects}
              className="mt-8 w-full rounded-xl bg-[#0874BD] px-5 py-3 font-semibold text-white hover:opacity-90"
            >
              Back to all quizzes
            </button>
          </section>
        </div>
      </main>
    );
  }

  // Guard against empty quizzes or an invalid question index.
  if (activeQuiz && !question) {
    return (
      <main className="min-h-screen bg-slate-50 p-8 text-center">
        <p className="text-slate-600">
          No questions are available in this quiz.
        </p>
        <button
          type="button"
          onClick={backToSubjects}
          className="mt-4 rounded-lg bg-[#0874BD] px-5 py-3 text-white"
        >
          Back to quizzes
        </button>
      </main>
    );
  }

  // Active quiz screen.
  if (activeQuiz) {
    const isSaved = saved.includes(question.id);

    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={backToSubjects}
              className="text-sm font-semibold text-[#0874BD] hover:underline"
            >
              ← All quizzes
            </button>
           
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-8">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-[#0874BD]">
                  Question {current + 1} of {questions.length}
                </span>

                <button
                  type="button"
                  onClick={toggleSaved}
                  className={`rounded - lg border px - 3 py - 2 text - sm font - semibold ${
          isSaved
            ? "border-amber-300 bg-amber-50 text-amber-800"
            : "border-slate-200 text-slate-600 hover:bg-slate-50"
        } `}
                >
                  {isSaved ? "★ Saved" : "☆ Save question"}
                </button>
              </div>

              <div className="mb-7 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[#0874BD] transition-all"
                  style={{
                    width: `${ ((current + 1) / questions.length) * 100 }% `,
                  }}
                />
              </div>

              <div className="mb-6 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                  {question.difficulty}
                </span>
                {question.subject && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                    {question.subject}
                  </span>
                )}
                {question.province && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                    {question.province}
                  </span>
                )}
              </div>

              <h1 className="text-xl font-bold leading-relaxed text-slate-900 md:text-2xl">
                {question.question}
              </h1>

              <div className="mt-7 space-y-3">

                {question.options.map((option, index) => {
                  const selected = answers[question.id] === index;

                  return (
                    <button
                      type="button"
                      key={index}
                      disabled={submitted}
                      onClick={() => chooseAnswer(index)}
                      className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition ${selected
                          ? "border-[#0874BD] bg-blue-50 ring-1 ring-[#0874BD]"
                          : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"
                        }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${selected
                            ? "border-[#0874BD] bg-[#0874BD] text-white"
                            : "border-slate-300 bg-white text-slate-700"
                          }`}
                      >
                        {LETTERS[index]}
                      </span>

                      <span className="text-sm leading-relaxed text-slate-800 md:text-base">
                        {option}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-6">
                <button
                  type="button"
                  disabled={current === 0}
                  onClick={() => goToQuestion(current - 1)}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                {current < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => goToQuestion(current + 1)}
                    className="rounded-lg bg-[#0874BD] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                  >
                    Next question →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={submitQuiz}
                    className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
                  >
                    Submit quiz
                  </button>
                )}
              </div>

              {current < questions.length - 1 && (
                <button
                  type="button"
                  onClick={submitQuiz}
                  className="mt-4 text-sm font-semibold text-slate-500 hover:text-slate-800"
                >
                  Submit quiz now
                </button>
              )}
            </section>

           
          </div>
        </div>
      </main>
    );
  }

  // Quiz category listing: every card comes from the backend data.
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#0874BD]">
              LOKSEWA PREPARATION
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Practice Quizzes
            </h1>
            <p className="mt-2 text-slate-600">
              Choose a category and test your knowledge.
            </p>
          </div>

          <Link
            to="/past-questions"
            className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Past Questions →
          </Link>
        </div>

        {quizzes.length === 0 ? (
          <section className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center">
            <h2 className="text-xl font-bold text-slate-800">
              No quizzes available yet
            </h2>
            <p className="mt-2 text-slate-500">
              Quizzes will appear here when the admin adds valid MCQ questions.
            </p>
          </section>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((quiz) => (
              <article
                key={quiz.name}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-xl font-bold text-[#0874BD]">
                  {quiz.name.charAt(0)}
                </div>

                <h2 className="mt-5 text-xl font-bold text-slate-900">
                  {quiz.name}
                </h2>

                {quiz.nepali && (
                  <p className="mt-1 text-sm text-slate-500">
                    {quiz.nepali}
                  </p>
                )}

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-sm text-slate-500">
                    {quiz.questions.length} questions
                  </span>
                  <span className="text-sm font-semibold text-[#0874BD]">
                    Start practice →
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => startQuiz(quiz)}
                  className="mt-5 w-full rounded-xl bg-[#0874BD] px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
                >
                  Start Quiz
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default Quiz;