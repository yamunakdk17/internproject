import { useCallback, useEffect, useState } from "react";
import api from "../../api/axios";

function UserManagement({ showToast }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/admin/users");

      const result = response.data?.data;

      if (!Array.isArray(result)) {
        throw new Error("Unexpected response from server");
      }

      setUsers(result);
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || "Failed to load users";

      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const changeRole = async (user) => {
    const newRole = user.role === "admin" ? "student" : "admin";

    const confirmed = window.confirm(
      `Are you sure you want to change ${user.name}'s role to ${newRole}?`,
    );

    if (!confirmed) return;

    setUpdatingId(user.id);
    setError("");

    try {
      await api.patch(`/admin/users/${user.id}/role`, {
        role: newRole,
      });

      setUsers((currentUsers) =>
        currentUsers.map((item) =>
          item.id === user.id ? { ...item, role: newRole } : item,
        ),
      );

      showToast?.(`${user.name}'s role changed to ${newRole}.`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update user role");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter((user) => {
    const searchText = search.toLowerCase();

    return (
      String(user.name || "")
        .toLowerCase()
        .includes(searchText) ||
      String(user.email || "")
        .toLowerCase()
        .includes(searchText) ||
      String(user.role || "")
        .toLowerCase()
        .includes(searchText) ||
      String(user.id || "").includes(searchText)
    );
  });

  const totalAdmins = users.filter((user) => user.role === "admin").length;

  const totalStudents = users.filter((user) => user.role === "student").length;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      {/* Heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-black text-[#182235]">User Management</h2>

          <p className="mt-1 text-sm text-slate-500">
            View registered accounts and manage administrator access.
          </p>
        </div>

        <button
          onClick={loadUsers}
          disabled={loading}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Refresh users"}
        </button>
      </div>

      {/* Summary cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-500">Total accounts</p>

          <p className="mt-2 text-2xl font-black text-[#182235]">
            {users.length}
          </p>
        </div>

        <div className="rounded-xl bg-blue-50 p-4">
          <p className="text-sm font-semibold text-blue-700">Students</p>

          <p className="mt-2 text-2xl font-black text-blue-900">
            {totalStudents}
          </p>
        </div>

        <div className="rounded-xl bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-700">
            Administrators
          </p>

          <p className="mt-2 text-2xl font-black text-emerald-900">
            {totalAdmins}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mt-6">
        <label
          htmlFor="user-search"
          className="mb-2 block text-sm font-bold text-slate-700"
        >
          Search accounts
        </label>

        <input
          id="user-search"
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, email, ID, or role..."
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#0874BD] focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Users table */}
      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-4">User</th>
              <th className="px-5 py-4">Email</th>
              <th className="px-5 py-4">Role</th>
              <th className="px-5 py-4">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td
                  colSpan="4"
                  className="px-5 py-10 text-center text-slate-500"
                >
                  Loading registered users...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td
                  colSpan="4"
                  className="px-5 py-10 text-center text-slate-500"
                >
                  No users found.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                const isAdmin = user.role === "admin";

                return (
                  <tr key={user.id} className="transition hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-100 font-black text-blue-700">
                          {String(user.name || "U")
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <p className="font-bold text-slate-800">
                            {user.name}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            ID: {user.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-slate-600">{user.email}</td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                          isAdmin
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <button
                        onClick={() => changeRole(user)}
                        disabled={updatingId === user.id}
                        className={`rounded-lg px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                          isAdmin
                            ? "border border-slate-200 text-slate-600 hover:bg-slate-100"
                            : "bg-[#0874BD] text-white hover:bg-[#07538E]"
                        }`}
                      >
                        {updatingId === user.id
                          ? "Updating..."
                          : isAdmin
                            ? "Make Student"
                            : "Make Admin"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-400">
        Role changes affect permissions. A promoted user should log out and log
        in again to receive a new login token.
      </p>
    </div>
  );
}

export default UserManagement;
