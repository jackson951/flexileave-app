import React, { useEffect, useState } from "react";
import ApiService from "../../api/web-api-service";
import { useAuth } from "../../contexts/AuthContext";

const ROLE_OPTIONS = ["EMPLOYEE", "MANAGER", "ADMIN"];

const EmployeeManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);
  const getInviteDefaults = () => ({
    name: "",
    email: "",
    role: "EMPLOYEE",
    department: "",
    position: "",
    phone: "",
    joinDate: new Date().toISOString().split("T")[0],
    password: "",
  });
  const [inviteForm, setInviteForm] = useState(getInviteDefaults);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await ApiService.get("/users");
      setUsers(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInviteSubmit = async (event) => {
    event.preventDefault();
    setInviteLoading(true);
    setModalError("");
    setModalSuccess("");
    try {
      await ApiService.post("/users/invite", inviteForm);
      setModalSuccess(`Invitation sent to ${inviteForm.email}`);
      setInviteForm(getInviteDefaults());
      fetchUsers();
      setInviteModalOpen(false);
    } catch (err) {
      setModalError(err.response?.data?.message || "Unable to send invite");
    } finally {
      setInviteLoading(false);
    }
  };

  const openInviteModal = () => {
    setModalError("");
    setModalSuccess("");
    setInviteModalOpen(true);
  };

  const closeInviteModal = () => {
    setModalError("");
    setInviteModalOpen(false);
  };

  const updateRole = async (id, role) => {
    try {
      await ApiService.put(`/users/${id}/role`, { role });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update role");
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await ApiService.put(`/users/${id}/status`, { status });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update status");
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
          Employee management
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          View, invite, and update roles & status for your organization.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Invite your teammates and keep their roles up to date.
        </p>
        <button
          onClick={openInviteModal}
          className="rounded-full border border-indigo-600 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-400 dark:bg-indigo-600/10 dark:text-indigo-200"
        >
          Invite new user
        </button>
      </div>
    </header>

    {modalSuccess && (
      <div className="rounded-xl border border-green-400 bg-green-50 px-4 py-3 text-sm text-green-700">
        {modalSuccess}
      </div>
    )}

    {isInviteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeInviteModal();
            }
          }}
        >
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Invite a teammate
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Add user details, assign a role, and optionally set a temporary password.
              </p>
            </div>
            <button
              type="button"
              onClick={closeInviteModal}
              className="text-xl font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {modalError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {modalError}
            </div>
          )}

          <form className="mt-4 space-y-3" onSubmit={handleInviteSubmit}>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Name
              </label>
              <input
                type="text"
                required
                value={inviteForm.name}
                onChange={(event) =>
                  setInviteForm((prev) => ({ ...prev, name: event.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Email
              </label>
              <input
                type="email"
                required
                value={inviteForm.email}
                onChange={(event) =>
                  setInviteForm((prev) => ({ ...prev, email: event.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Role
                </label>
                <select
                  value={inviteForm.role}
                  onChange={(event) =>
                    setInviteForm((prev) => ({ ...prev, role: event.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {role.toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Department
                </label>
                <input
                  type="text"
                  value={inviteForm.department}
                  onChange={(event) =>
                    setInviteForm((prev) => ({
                      ...prev,
                      department: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Position
                </label>
                <input
                  type="text"
                  value={inviteForm.position}
                  onChange={(event) =>
                    setInviteForm((prev) => ({ ...prev, position: event.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Phone
                </label>
                <input
                  type="text"
                  value={inviteForm.phone}
                  onChange={(event) =>
                    setInviteForm((prev) => ({ ...prev, phone: event.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Join date
                </label>
                <input
                  type="date"
                  value={inviteForm.joinDate}
                  onChange={(event) =>
                    setInviteForm((prev) => ({ ...prev, joinDate: event.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Password (optional)
                </label>
                <input
                  type="password"
                  minLength={8}
                  placeholder="Leave blank to let user set a password"
                  value={inviteForm.password}
                  onChange={(event) =>
                    setInviteForm((prev) => ({ ...prev, password: event.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={closeInviteModal}
                className="text-sm font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={inviteLoading}
                className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
              >
                {inviteLoading ? "Inviting..." : "Send invite"}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

      {error && (
        <div className="rounded-xl border border-red-400 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Employees
        </h2>
        {loading ? (
          <p className="py-6 text-center text-sm text-gray-500">Loading...</p>
        ) : users.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">
            No employees yet.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
              <thead className="text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((person) => (
                  <tr key={person.id} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {person.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {person.department || "General"}
                      </div>
                    </td>
                    <td className="px-4 py-3">{person.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={person.role}
                        onChange={(event) => updateRole(person.id, event.target.value)}
                        className="rounded-xl border border-gray-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      >
                        {ROLE_OPTIONS.map((role) => (
                          <option key={role} value={role}>
                            {role.toLowerCase()}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={person.status || "ACTIVE"}
                        onChange={(event) =>
                          updateStatus(person.id, event.target.value)
                        }
                        className="rounded-xl border border-gray-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="ACTIVE">active</option>
                        <option value="INACTIVE">inactive</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() =>
                          updateStatus(
                            person.id,
                            person.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
                          )
                        }
                        className="text-xs text-indigo-600 hover:underline"
                      >
                        toggle status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default EmployeeManagement;
