import { Link, useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { label: "Home", path: "/" },
  { label: "Practice Quiz", path: "/quiz" },
  { label: "Past papers", path: "/past-questions" },
];

function Mark() {
  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#0874BD] text-[13px] font-black tracking-tight text-white shadow-[0_8px_20px_rgba(8,116,189,.22)]">
      LQ
    </span>
  );
}

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-5 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <Mark />
          <span className="hidden min-[430px]:block">
            <span className="block text-[15px] font-extrabold tracking-[-.02em] text-[#182235]">Loksewa Quiz</span>
            <span className="block text-[11px] font-medium text-slate-400">Practice smarter. Prepare better.</span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                  active ? "bg-[#EAF4FB] text-[#07538E]" : "text-slate-600 hover:bg-slate-50 hover:text-[#0874BD]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-4">
          {!user ? (
            <>
              <Link to="/login" className="hidden rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 sm:block">Log in</Link>
              <Link
                to="/register"
                className="rounded-xl bg-[#e1e8ed] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#0b66ab] active:shadow-none"
              >
                Get started
              </Link>            </>
          ) : user.role === "admin" ? (
            <>
              <Link to="/admin" className="rounded-xl bg-[#0874BD] px-4 py-2.5 text-sm font-bold text-white">Admin</Link>
              <button onClick={logout} className="hidden rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 sm:block">Log out</button>
            </>
          ) : (
            <>
              <Link to="/dashboard" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-[#182235] hover:border-[#B9D9ED] hover:text-[#0874BD]">My study</Link>
              <button onClick={logout} className="hidden rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 sm:block">Log out</button>
            </>
          )}
        </div>
      </div>

      <div className="border-t border-slate-100 md:hidden">
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2 sm:px-6">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold ${location.pathname === item.path ? "bg-[#EAF4FB] text-[#07538E]" : "text-slate-500"}`}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
