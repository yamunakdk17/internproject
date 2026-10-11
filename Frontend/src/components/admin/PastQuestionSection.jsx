
import React, { useEffect, useRef, useState } from "react";
import api from "../../api/axios";

import {
    subjects,
    provinces,
    levels,
    initialPastQuestionForm,
} from "../../constants/adminConstants";

const API_SERVER = "http://localhost:5000";

function PastQuestionSection({ showToast }) {
    const [form, setForm] = useState({ ...initialPastQuestionForm });
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const [papers, setPapers] = useState([]);
    const [loadingPapers, setLoadingPapers] = useState(true);
    const [replacingId, setReplacingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    const fileInputRef = useRef(null);
    const replaceInputRef = useRef(null);
    const [paperToReplace, setPaperToReplace] = useState(null);

    const inputClass =
        "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

    const notify = (message) => {
        if (typeof showToast === "function") {
            showToast(message);
        } else {
            console.log(message);
        }
    };

    const updateForm = (field, value) => {
        setForm((previous) => ({
            ...previous,
            [field]: value,
        }));
    };

    // Handles common response formats returned by the API.
    const getRecords = (response) => {
        const result = response?.data;

        if (Array.isArray(result)) return result;
        if (Array.isArray(result?.data)) return result.data;
        if (Array.isArray(result?.data?.papers)) return result.data.papers;
        if (Array.isArray(result?.data?.records)) return result.data.records;
        if (Array.isArray(result?.papers)) return result.papers;
        if (Array.isArray(result?.records)) return result.records;

        return [];
    };

    const getPaperId = (paper) =>
        paper.id ??
        paper.paper_id ??
        paper.past_question_id ??
        paper.pastQuestionId;

    const getPaperTitle = (paper) =>
        paper.title ||
        paper.original_name ||
        paper.originalName ||
        paper.file_name ||
        paper.filename ||
        "Untitled question paper";

    const getFileName = (paper) =>
        paper.file_name ||
        paper.fileName ||
        paper.filename ||
        "";

    const getFileUrl = (paper) => {
        const storedUrl =
            paper.file_url ||
            paper.fileUrl ||
            paper.url;

        if (storedUrl && /^https?:\/\//i.test(storedUrl)) {
            return storedUrl;
        }

        const fileName = getFileName(paper);
        if (!fileName) return "";

        return `${API_SERVER}/uploads/past-questions/${encodeURIComponent(
            fileName
        )}`;
    };

    const loadPapers = async () => {
        setLoadingPapers(true);

        try {
            const response = await api.get("/admin/past-questions");
            setPapers(getRecords(response));
        } catch (error) {
            console.error("Load past questions error:", error);
            notify(
                error.response?.data?.message ||
                "Could not load past question papers."
            );
        } finally {
            setLoadingPapers(false);
        }
    };

    useEffect(() => {
        loadPapers();
        // Load the list when this section first opens.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const validateFile = (selectedFile) => {
        if (!selectedFile) return false;

        const name = selectedFile.name.toLowerCase();
        if (!name.endsWith(".pdf") && !name.endsWith(".docx")) {
            notify("Only PDF and DOCX files are allowed.");
            return false;
        }

        if (selectedFile.size > 10 * 1024 * 1024) {
            notify("File size must be 10 MB or less.");
            return false;
        }

        return true;
    };

    const handleFileChange = (event) => {
        const selectedFile = event.target.files?.[0];

        if (!selectedFile) {
            setFile(null);
            return;
        }

        if (!validateFile(selectedFile)) {
            setFile(null);
            event.target.value = "";
            return;
        }

        setFile(selectedFile);
    };

    const resetForm = () => {
        setForm({ ...initialPastQuestionForm });
        setFile(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (uploading) return;

        if (!file) {
            notify("Please select a PDF or DOCX file.");
            return;
        }

        if (!form.title?.trim()) {
            notify("Please enter the title.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", form.title.trim());
        formData.append("subject", form.subject || "");
        formData.append("province", form.province || "");
        formData.append("examDate", form.examDate || "");
        formData.append("level", form.level || "");
        formData.append("year", form.year || "");
        formData.append("description", form.description || "");

        setUploading(true);

        try {
            const response = await api.post(
                "/admin/past-questions/upload",
                formData
            );

            if (response.data?.success === false) {
                throw new Error(
                    response.data?.message || "Upload was not confirmed."
                );
            }

            notify(
                response.data?.message ||
                "Past question uploaded successfully."
            );

            resetForm();
            await loadPapers();
        } catch (error) {
            console.error("Upload past question error:", error);

            const status = error.response?.status;
            let message =
                error.response?.data?.message ||
                error.message ||
                "Upload failed.";

            if (!error.response && error.request) {
                message = "Backend not responding. Check your server and API URL.";
            } else if (status === 401) {
                message = "Please log in again.";
            } else if (status === 403) {
                message = "Only admins can upload past questions.";
            } else if (status === 404) {
                message = "Upload route not found. Check the backend route.";
            } else if (status === 413) {
                message = "File is too large.";
            }

            notify(message);
        } finally {
            setUploading(false);
        }
    };

    const handleView = (paper) => {
        const url = getFileUrl(paper);

        if (!url) {
            notify("A file URL could not be found for this paper.");
            return;
        }

        window.open(url, "_blank", "noopener,noreferrer");
    };

    const openReplacePicker = (paper) => {
        if (!getPaperId(paper)) {
            notify("This paper has no ID. Check the backend response.");
            return;
        }

        setPaperToReplace(paper);

        if (replaceInputRef.current) {
            replaceInputRef.current.value = "";
            replaceInputRef.current.click();
        }
    };

    const handleReplaceFile = async (event) => {
        const selectedFile = event.target.files?.[0];
        const paper = paperToReplace;
        const id = paper ? getPaperId(paper) : null;

        if (!selectedFile || !id) return;

        if (!validateFile(selectedFile)) {
            event.target.value = "";
            return;
        }

        const confirmed = window.confirm(
            `Replace the file for "${getPaperTitle(paper)}"?`
        );

        if (!confirmed) {
            event.target.value = "";
            return;
        }

        const formData = new FormData();
        formData.append("file", selectedFile);

        setReplacingId(id);

        try {
            const response = await api.put(
                `/admin/past-questions/${id}`,
                formData
            );

            if (response.data?.success === false) {
                throw new Error(
                    response.data?.message || "File replacement failed."
                );
            }

            notify(
                response.data?.message ||
                "Question paper file replaced successfully."
            );

            await loadPapers();
        } catch (error) {
            console.error("Replace past question error:", error);
            notify(
                error.response?.data?.message ||
                error.message ||
                "Could not replace this file."
            );
        } finally {
            setReplacingId(null);
            setPaperToReplace(null);
            event.target.value = "";
        }
    };

    const handleDelete = async (paper) => {
        const id = getPaperId(paper);

        if (!id) {
            notify("This paper has no ID. Check the backend response.");
            return;
        }

        const confirmed = window.confirm(
            `Delete "${getPaperTitle(paper)}"? This action cannot be undone.`
        );

        if (!confirmed) return;

        setDeletingId(id);

        try {
            const response = await api.delete(
                `/admin/past-questions/${id}`
            );

            if (response.data?.success === false) {
                throw new Error(
                    response.data?.message || "Delete was not confirmed."
                );
            }

            notify(
                response.data?.message ||
                "Past question deleted successfully."
            );

            await loadPapers();
        } catch (error) {
            console.error("Delete past question error:", error);
            notify(
                error.response?.data?.message ||
                error.message ||
                "Could not delete this paper."
            );
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Upload form */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-slate-900">
                        Add Past Question
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Upload previous Loksewa question papers.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-6 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                        <div className="mb-3 text-3xl">📄</div>
                        <p className="mb-2 font-semibold text-slate-700">
                            Upload Question Paper
                        </p>
                        <p className="mb-4 text-xs text-slate-500">
                            PDF or DOCX (maximum 10 MB)
                        </p>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            onChange={handleFileChange}
                            disabled={uploading}
                            className="mx-auto block w-full max-w-md rounded-lg border border-slate-300 bg-white text-sm"
                        />

                        {file && (
                            <p className="mt-3 break-all text-sm font-semibold text-blue-600">
                                Selected: {file.name}
                            </p>
                        )}
                    </div>

                    <div className="mb-5">
                        <label
                            htmlFor="past-question-title"
                            className="mb-2 block text-sm font-semibold text-slate-700"
                        >
                            Title *
                        </label>
                        <input
                            id="past-question-title"
                            type="text"
                            value={form.title || ""}
                            onChange={(e) => updateForm("title", e.target.value)}
                            placeholder="Example: Section Officer First Paper 2081"
                            required
                            disabled={uploading}
                            className={inputClass}
                        />
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                        <Field label="Subject">
                            <select
                                value={form.subject || ""}
                                onChange={(e) => updateForm("subject", e.target.value)}
                                disabled={uploading}
                                className={inputClass}
                            >
                                {subjects.map((subject) => (
                                    <option key={subject} value={subject}>
                                        {subject}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Province">
                            <select
                                value={form.province || ""}
                                onChange={(e) => updateForm("province", e.target.value)}
                                disabled={uploading}
                                className={inputClass}
                            >
                                {provinces.map((province) => (
                                    <option key={province} value={province}>
                                        {province}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Exam Date">
                            <input
                                type="date"
                                value={form.examDate || ""}
                                onChange={(e) => updateForm("examDate", e.target.value)}
                                disabled={uploading}
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Level">
                            <select
                                value={form.level || ""}
                                onChange={(e) => updateForm("level", e.target.value)}
                                disabled={uploading}
                                className={inputClass}
                            >
                                {levels.map((level) => (
                                    <option key={level} value={level}>
                                        {level}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Year">
                            <input
                                type="number"
                                value={form.year || ""}
                                onChange={(e) => updateForm("year", e.target.value)}
                                placeholder="2081"
                                disabled={uploading}
                                className={inputClass}
                            />
                        </Field>
                    </div>

                    <div className="mb-5 mt-5">
                        <label
                            htmlFor="past-question-description"
                            className="mb-2 block text-sm font-semibold text-slate-700"
                        >
                            Description
                        </label>
                        <textarea
                            id="past-question-description"
                            rows={4}
                            value={form.description || ""}
                            onChange={(e) =>
                                updateForm("description", e.target.value)
                            }
                            placeholder="Enter description..."
                            disabled={uploading}
                            className={inputClass}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={uploading}
                        className="rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {uploading ? "Uploading..." : "Upload Past Question"}
                    </button>
                </form>
            </div>

            {/* Uploaded paper management */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Manage Past Questions
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            View, replace, or delete uploaded papers.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={loadPapers}
                        disabled={loadingPapers}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                        {loadingPapers ? "Refreshing..." : "↻ Refresh list"}
                    </button>
                </div>

                <input
                    ref={replaceInputRef}
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleReplaceFile}
                    className="hidden"
                />

                {loadingPapers ? (
                    <p className="rounded-lg bg-slate-50 p-5 text-sm text-slate-500">
                        Loading uploaded papers...
                    </p>
                ) : papers.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                        <div className="mb-2 text-3xl">📂</div>
                        <p className="font-semibold text-slate-700">
                            No past questions found
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                            Upload a paper using the form above. It will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {papers.map((paper, index) => {
                            const id = getPaperId(paper);
                            const title = getPaperTitle(paper);
                            const filename = getFileName(paper);

                            return (
                                <div
                                    key={id ?? filename ?? index}
                                    className="rounded-xl border border-slate-200 p-4 transition hover:border-slate-300"
                                >
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex min-w-0 items-start gap-3">
                                            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-blue-50 text-xl">
                                                {filename.toLowerCase().endsWith(".docx")
                                                    ? "📝"
                                                    : "📄"}
                                            </div>

                                            <div className="min-w-0">
                                                <h3 className="break-words font-bold text-slate-900">
                                                    {title}
                                                </h3>
                                                {filename && (
                                                    <p className="mt-1 break-all text-xs text-slate-500">
                                                        {filename}
                                                    </p>
                                                )}
                                                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                                                    {paper.subject && (
                                                        <span className="rounded-full bg-slate-100 px-2.5 py-1">
                                                            {paper.subject}
                                                        </span>
                                                    )}
                                                    {paper.province && (
                                                        <span className="rounded-full bg-slate-100 px-2.5 py-1">
                                                            {paper.province}
                                                        </span>
                                                    )}
                                                    {paper.year && (
                                                        <span className="rounded-full bg-slate-100 px-2.5 py-1">
                                                            Year {paper.year}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex shrink-0 flex-wrap gap-2">
                                          

                                            <button
                                                type="button"
                                                onClick={() => openReplacePicker(paper)}
                                                disabled={replacingId === id || deletingId === id}
                                                className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-60"
                                            >
                                                {replacingId === id
                                                    ? "Replacing..."
                                                    : "✎ Edit / Replace"}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleDelete(paper)}
                                                disabled={deletingId === id || replacingId === id}
                                                className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-60"
                                            >
                                                {deletingId === id
                                                    ? "Deleting..."
                                                    : "🗑 Delete"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

function Field({ label, children }) {
    return (
        <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
                {label}
            </label>
            {children}
        </div>
    );
}

export default PastQuestionSection;
