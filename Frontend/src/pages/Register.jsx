
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim(),
            password: form.password,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message || "Registration failed."
        );
      }

      setMessage("Account created successfully. Redirecting to login...");

      navigate("/login", {
        replace: true,
        state: { registered: true },
      });
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to the backend. Check whether the server is running."
          : err.message || "Unable to register."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-5 py-10">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="mb-8 flex items-center justify-center gap-3"
        >
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#0874BD] text-sm font-black text-white">
            LQ
          </span>
          <span className="text-xl font-extrabold text-[#182235]">
            Loksewa Quiz
          </span>
        </Link>

        <div className="mb-8 text-center">
          <p className="text-xs font-black uppercase tracking-[.16em] text-[#0874BD]">
            Student registration
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-[#182235]">
            Create your account.
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Enter your details to get started.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-5">
          {[
            ["name", "Full name", "Your name", "text"],
            ["email", "Email address", "you@example.com", "email"],
            ["password", "Password", "Create a password", "password"],
            ["confirm", "Confirm password", "Repeat your password", "password"],
          ].map(([key, label, placeholder, type]) => (
            <label key={key} className="block">
              <span className="mb-2 block text-sm font-bold text-[#182235]">
                {label}
              </span>
              <input
                value={form[key]}
                onChange={(e) => {
                  setForm({ ...form, [key]: e.target.value });
                  setError("");
                  setMessage("");
                }}
                type={type}
                autoComplete={
                  key === "name"
                    ? "name"
                    : key === "email"
                      ? "email"
                      : "new-password"
                }
                required
                minLength={
                  key === "password" || key === "confirm"
                    ? 8
                    : undefined
                }
                placeholder={placeholder}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#0874BD] focus:ring-4 focus:ring-[#0874BD]/10"
              />
            </label>
          ))}

          {error && (
            <div role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}

          {message && (
            <div role="status" className="rounded-xl bg-[#F2F9FD] px-4 py-3 text-sm font-semibold text-[#07538E]">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-xl bg-[#0874BD] text-sm font-extrabold text-white transition hover:bg-[#07538E] disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-extrabold text-[#0874BD] hover:underline"
          >
            Log in
          </Link>
        </p>

        <Link
          to="/"
          className="mt-6 block text-center text-sm font-semibold text-slate-400 hover:text-[#0874BD]"
        >
          ← Back to home
        </Link>
      </div>
    </div>
  );
}

export default Register;