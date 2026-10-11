
import { useCallback, useEffect, useState } from "react";

const API_BASE = "http://localhost:5000/api/questions";
const GET_QUESTIONS_URL = `${API_BASE}/get`;
const CREATE_QUESTION_URL = `${API_BASE}/create`;

const UPDATE_QUESTION_URL = (id) => `${API_BASE}/${id}`;
const DELETE_QUESTION_URL = (id) => `${API_BASE}/${id}`;

const CATEGORIES = [
    "Administration",
    "General Knowledge",
    "Education",
    "Health",
    "IT",
    "Finance"
];

const DIFFICULTIES = ["Easy", "Medium", "Hard"];

const INITIAL_FORM = {
    question_type: "MCQ",
    category: "General Knowledge",
    difficulty: "Easy",
    question_text: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_answer: "A",
    explanation: "",
};

const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-[#182235] outline-none transition focus:border-[#0874BD] focus:ring-2 focus:ring-[#0874BD]/15";

const labelClass =
    "mb-1.5 block text-sm font-medium text-[#182235]";

function getQuestionsFromResponse(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.questions)) return data.questions;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.data?.questions)) return data.data.questions;
    if (Array.isArray(data?.results)) return data.results;

    return [];
}

function getQuestionId(question) {
    return question?.id ?? question?._id;
}

function getErrorMessage(data, fallback) {
    return data?.message || data?.error || fallback;
}

export default function QuestionSection() {
    const [questions, setQuestions] = useState([]);
    const [form, setForm] = useState({ ...INITIAL_FORM });

    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [difficultyFilter, setDifficultyFilter] = useState("All");

    const getToken = () => localStorage.getItem("token");

    const fetchQuestions = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch(GET_QUESTIONS_URL);
            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    getErrorMessage(data, "Failed to load questions.")
                );
            }

            setQuestions(getQuestionsFromResponse(data));
        } catch (err) {
            setError(
                err.message ||
                "Could not connect to the backend. Check whether your server is running."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchQuestions();
    }, [fetchQuestions]);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const resetForm = () => {
        setForm({ ...INITIAL_FORM });
        setEditingId(null);
    };

    const validateForm = () => {
        const requiredFields = [
            ["question_text", "Please enter the question."],
            ["option_a", "Please enter option A."],
            ["option_b", "Please enter option B."],
            ["option_c", "Please enter option C."],
            ["option_d", "Please enter option D."],
        ];

        for (const [field, message] of requiredFields) {
            if (!String(form[field] || "").trim()) {
                return message;
            }
        }

        if (!["A", "B", "C", "D"].includes(form.correct_answer)) {
            return "Please select a valid correct answer.";
        }

        return "";
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        const validationMessage = validateForm();

        if (validationMessage) {
            setError(validationMessage);
            return;
        }

        const token = getToken();

        if (!token) {
            setError(
                "Admin authentication token was not found. Please log in again."
            );
            return;
        }

        const payload = {
            question_type: form.question_type,
            category: form.category,
            difficulty: form.difficulty,
            question_text: form.question_text.trim(),
            option_a: form.option_a.trim(),
            option_b: form.option_b.trim(),
            option_c: form.option_c.trim(),
            option_d: form.option_d.trim(),
            correct_answer: form.correct_answer,
            explanation: form.explanation.trim(),
        };

        setSaving(true);

        try {
            const isEditing = editingId !== null;

            const response = await fetch(
                isEditing
                    ? UPDATE_QUESTION_URL(editingId)
                    : CREATE_QUESTION_URL,
                {
                    method: isEditing ? "PUT" : "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    getErrorMessage(
                        data,
                        isEditing
                            ? "Failed to update question."
                            : "Failed to create question."
                    )
                );
            }

            setSuccess(
                data.message ||
                (isEditing
                    ? "Question updated successfully."
                    : "Question added successfully.")
            );

            resetForm();
            await fetchQuestions();
        } catch (err) {
            setError(
                err.message ||
                "Something went wrong while saving the question."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (question) => {
        const id = getQuestionId(question);

        if (id === undefined || id === null) {
            setError("This question does not have a valid ID.");
            return;
        }

        setError("");
        setSuccess("");
        setEditingId(id);

        setForm({
            question_type: question.question_type || "MCQ",
            category: question.category || "General Knowledge",
            difficulty: question.difficulty || "Easy",
            question_text: question.question_text || "",
            option_a: question.option_a || "",
            option_b: question.option_b || "",
            option_c: question.option_c || "",
            option_d: question.option_d || "",
            correct_answer: String(
                question.correct_answer || "A"
            ).toUpperCase(),
            explanation: question.explanation || "",
        });

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    const handleDelete = async (question) => {
        const id = getQuestionId(question);

        if (id === undefined || id === null) {
            setError("This question does not have a valid ID.");
            return;
        }

        const confirmed = window.confirm(
            "Are you sure you want to delete this question? This action cannot be undone."
        );

        if (!confirmed) return;

        const token = getToken();

        if (!token) {
            setError(
                "Admin authentication token was not found. Please log in again."
            );
            return;
        }

        setError("");
        setSuccess("");
        setDeletingId(id);

        try {
            const response = await fetch(DELETE_QUESTION_URL(id), {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    getErrorMessage(data, "Failed to delete question.")
                );
            }

            if (String(editingId) === String(id)) {
                resetForm();
            }

            setSuccess(data.message || "Question deleted successfully.");
            await fetchQuestions();
        } catch (err) {
            setError(
                err.message ||
                "Something went wrong while deleting the question."
            );
        } finally {
            setDeletingId(null);
        }
    };

    const filteredQuestions = questions.filter((question) => {
        const searchText = search.trim().toLowerCase();

        const matchesSearch =
            !searchText ||
            [
                question.question_text,
                question.category,
                question.difficulty,
                question.option_a,
                question.option_b,
                question.option_c,
                question.option_d,
            ].some((value) =>
                String(value || "").toLowerCase().includes(searchText)
            );

        const matchesCategory =
            categoryFilter === "All" ||
            question.category === categoryFilter;

        const matchesDifficulty =
            difficultyFilter === "All" ||
            question.difficulty === difficultyFilter;

        return (
            matchesSearch &&
            matchesCategory &&
            matchesDifficulty
        );
    });

    const categoryCounts = CATEGORIES.map((category) => ({
        name: category,
        count: questions.filter(
            (question) => question.category === category
        ).length,
    }));

    return (
        <section className="space-y-6 text-[#182235]">
            {/* Page heading */}
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                    <p className="text-sm font-semibold text-[#0874BD]">
                        ADMINISTRATION
                    </p>

                    <h1 className="mt-1 text-2xl font-bold tracking-tight">
                        Question Management
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        Add, update, search, and manage Loksewa practice questions.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={fetchQuestions}
                    disabled={loading}
                    className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {loading ? "Refreshing..." : "Refresh questions"}
                </button>
            </div>

            {/* Notifications */}
            {error && (
                <div
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                    {error}
                </div>
            )}

            {success && (
                <div
                    role="status"
                    className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
                >
                    {success}
                </div>
            )}

            {/* Summary cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-[#D8EAF7] bg-[#EAF4FB] p-5">
                    <p className="text-sm font-medium text-gray-600">
                        Total questions
                    </p>
                    <p className="mt-2 text-3xl font-bold text-[#0874BD]">
                        {questions.length}
                    </p>
                </div>

                {categoryCounts.map((item) => (
                    <div
                        key={item.name}
                        className="rounded-xl border border-gray-200 bg-white p-5"
                    >
                        <p className="text-sm font-medium text-gray-500">
                            {item.name}
                        </p>
                        <p className="mt-2 text-3xl font-bold">
                            {item.count}
                        </p>
                    </div>
                ))}
            </div>

            {/* Create / edit form */}
            <div
                id="question-form"
                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
            >
                <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
                    <h2 className="text-lg font-bold">
                        {editingId !== null
                            ? "Edit question"
                            : "Add a new question"}
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        {editingId !== null
                            ? "Update the question details below and save your changes."
                            : "Complete the form to add a question to your question bank."}
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-5 p-5 sm:p-6"
                >
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                            <label
                                htmlFor="question_type"
                                className={labelClass}
                            >
                                Question type
                            </label>

                            <select
                                id="question_type"
                                name="question_type"
                                value={form.question_type}
                                onChange={handleChange}
                                className={inputClass}
                            >
                                <option value="MCQ">Multiple choice (MCQ)</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="category" className={labelClass}>
                                Category
                            </label>

                            <select
                                id="category"
                                name="category"
                                value={form.category}
                                onChange={handleChange}
                                className={inputClass}
                                required
                            >
                                {CATEGORIES.map((category) => (
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="difficulty" className={labelClass}>
                                Difficulty
                            </label>

                            <select
                                id="difficulty"
                                name="difficulty"
                                value={form.difficulty}
                                onChange={handleChange}
                                className={inputClass}
                                required
                            >
                                {DIFFICULTIES.map((difficulty) => (
                                    <option key={difficulty} value={difficulty}>
                                        {difficulty}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="question_text"
                            className={labelClass}
                        >
                            Question text
                        </label>

                        <textarea
                            id="question_text"
                            name="question_text"
                            value={form.question_text}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Enter the complete question..."
                            className={inputClass}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {[
                            ["A", "option_a"],
                            ["B", "option_b"],
                            ["C", "option_c"],
                            ["D", "option_d"],
                        ].map(([letter, field]) => (
                            <div key={field}>
                                <label htmlFor={field} className={labelClass}>
                                    Option {letter}
                                </label>

                                <input
                                    id={field}
                                    name={field}
                                    type="text"
                                    value={form[field]}
                                    onChange={handleChange}
                                    placeholder={`Enter option ${letter}...`}
                                    className={inputClass}
                                    required
                                />
                            </div>
                        ))}
                    </div>

                    <div>
                        <label
                            htmlFor="correct_answer"
                            className={labelClass}
                        >
                            Correct answer
                        </label>

                        <select
                            id="correct_answer"
                            name="correct_answer"
                            value={form.correct_answer}
                            onChange={handleChange}
                            className={inputClass}
                            required
                        >
                            <option value="A">Option A</option>
                            <option value="B">Option B</option>
                            <option value="C">Option C</option>
                            <option value="D">Option D</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="explanation" className={labelClass}>
                            Explanation
                            <span className="ml-1 font-normal text-gray-400">
                                (optional)
                            </span>
                        </label>

                        <textarea
                            id="explanation"
                            name="explanation"
                            value={form.explanation}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Explain why this answer is correct..."
                            className={inputClass}
                        />
                    </div>

                    <div className="flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
                        {editingId !== null && (
                            <button
                                type="button"
                                onClick={() => {
                                    resetForm();
                                    setError("");
                                    setSuccess("");
                                }}
                                className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold transition hover:bg-gray-50"
                            >
                                Cancel editing
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={() => {
                                resetForm();
                                setError("");
                                setSuccess("");
                            }}
                            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold transition hover:bg-gray-50"
                        >
                            Clear form
                        </button>

                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-lg bg-[#0874BD] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0665A5] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving
                                ? "Saving..."
                                : editingId !== null
                                    ? "Save changes"
                                    : "Add question"}
                        </button>
                    </div>
                </form>
            </div>

            {/* Question list */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
                    <h2 className="text-lg font-bold">Saved questions</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Browse and manage questions stored in your backend database.
                    </p>
                </div>

                {/* Search and filters */}
                <div className="grid grid-cols-1 gap-3 border-b border-gray-100 bg-gray-50/60 p-4 sm:grid-cols-2 xl:grid-cols-3">
                    <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search questions or options..."
                        aria-label="Search questions"
                        className={inputClass}
                    />

                    <select
                        value={categoryFilter}
                        onChange={(event) => setCategoryFilter(event.target.value)}
                        aria-label="Filter by category"
                        className={inputClass}
                    >
                        <option value="All">All categories</option>
                        {CATEGORIES.map((category) => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>

                    <select
                        value={difficultyFilter}
                        onChange={(event) =>
                            setDifficultyFilter(event.target.value)
                        }
                        aria-label="Filter by difficulty"
                        className={inputClass}
                    >
                        <option value="All">All difficulties</option>
                        {DIFFICULTIES.map((difficulty) => (
                            <option key={difficulty} value={difficulty}>
                                {difficulty}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="border-b border-gray-100 px-5 py-3 text-sm text-gray-500">
                    Showing{" "}
                    <span className="font-semibold text-[#182235]">
                        {filteredQuestions.length}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-[#182235]">
                        {questions.length}
                    </span>{" "}
                    questions
                </div>

                {loading ? (
                    <div className="px-5 py-12 text-center text-sm text-gray-500">
                        Loading questions...
                    </div>
                ) : filteredQuestions.length === 0 ? (
                    <div className="px-5 py-12 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF4FB] text-xl text-[#0874BD]">
                            ?
                        </div>

                        <h3 className="mt-3 font-semibold">
                            No questions found
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                            {questions.length === 0
                                ? "Add your first question using the form above."
                                : "Try changing your search or filter settings."}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredQuestions.map((question, index) => {
                            const id = getQuestionId(question);

                            return (
                                <article
                                    key={id ?? `${question.question_text}-${index}`}
                                    className="p-5 transition hover:bg-gray-50/60 sm:p-6"
                                >
                                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                        <div className="min-w-0 flex-1">
                                            <div className="mb-3 flex flex-wrap items-center gap-2">
                                                <span className="rounded-md bg-[#EAF4FB] px-2.5 py-1 text-xs font-semibold text-[#0874BD]">
                                                    {question.category || "Uncategorized"}
                                                </span>

                                                <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                                                    {question.difficulty || "Unspecified"}
                                                </span>

                                                <span className="rounded-md border border-gray-200 px-2.5 py-1 text-xs text-gray-500">
                                                    {question.question_type || "MCQ"}
                                                </span>
                                            </div>

                                            <h3 className="whitespace-pre-wrap break-words font-semibold leading-6">
                                                <span className="mr-2 text-[#0874BD]">
                                                    {index + 1}.
                                                </span>
                                                {question.question_text}
                                            </h3>

                                            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                {[
                                                    ["A", question.option_a],
                                                    ["B", question.option_b],
                                                    ["C", question.option_c],
                                                    ["D", question.option_d],
                                                ].map(([letter, option]) => {
                                                    const isCorrect =
                                                        String(question.correct_answer || "")
                                                            .toUpperCase() === letter;

                                                    return (
                                                        <div
                                                            key={letter}
                                                            className={`flex gap-2 rounded-lg border px-3 py-2.5 text-sm ${isCorrect
                                                                    ? "border-green-200 bg-green-50 text-green-800"
                                                                    : "border-gray-100 bg-white text-gray-600"
                                                                }`}
                                                        >
                                                            <span className="shrink-0 font-semibold">
                                                                {letter}.
                                                            </span>
                                                            <span className="break-words">
                                                                {option || "—"}
                                                            </span>
                                                            {isCorrect && (
                                                                <span className="ml-auto shrink-0 text-xs font-semibold">
                                                                    Correct
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {question.explanation && (
                                                <div className="mt-3 rounded-lg border border-[#D8EAF7] bg-[#EAF4FB]/60 p-3">
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-[#0874BD]">
                                                        Explanation
                                                    </p>
                                                    <p className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-600">
                                                        {question.explanation}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex shrink-0 gap-2 xl:pl-4">
                                            <button
                                                type="button"
                                                onClick={() => handleEdit(question)}
                                                className="rounded-lg border border-[#0874BD]/30 px-4 py-2 text-sm font-semibold text-[#0874BD] transition hover:bg-[#EAF4FB]"
                                            >
                                                Edit
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleDelete(question)}
                                                disabled={
                                                    deletingId !== null &&
                                                    String(deletingId) === String(id)
                                                }
                                                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {deletingId !== null &&
                                                    String(deletingId) === String(id)
                                                    ? "Deleting..."
                                                    : "Delete"}
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
}
