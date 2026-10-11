import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Invalid email or password.");
      }

      const token = result.data?.token;
      const user = result.data?.user;

      if (!token || !user) {
        throw new Error("Login response is missing the token or user.");
      }

      const safeUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      };

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(safeUser));

      if (String(user.role).toLowerCase() === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to the server. Please check that your backend is running."
          : err.message || "Unable to log in."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-5 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#0874BD] text-sm font-black text-white">
            LQ
          </span>
          <span className="text-xl font-extrabold text-[#182235]">
            Loksewa Quiz
          </span>
        </Link>

        <div className="mb-8 text-center">
          <p className="text-xs font-black uppercase tracking-[.16em] text-[#0874BD]">
            Student login
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-tight text-[#182235]">
            Welcome back.
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Log in to continue your preparation.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-[#182235]">
              Email address
            </span>

            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#0874BD] focus:ring-4 focus:ring-[#0874BD]/10"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-[#182235]">
              Password
            </span>

            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              required
              placeholder="Enter your password"
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#0874BD] focus:ring-4 focus:ring-[#0874BD]/10"
            />
          </label>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-xl bg-[#0874BD] text-sm font-extrabold text-white transition hover:bg-[#07538E] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing you in..." : "Log in"}
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-slate-500">
          New to Loksewa Quiz?{" "}
          <Link
            to="/register"
            className="font-extrabold text-[#0874BD] hover:underline"
          >
            Create an account
          </Link>
        </p>

        <Link
          to="/"
          className="mt-6 block text-center text-sm font-semibold text-slate-400 transition hover:text-[#0874BD]"
        >
          ← Back to home
        </Link>
      </div>
    </div>
  );
}

export default Login;
