import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import ApiService from "../../api/web-api-service";
import { useAuth } from "../../contexts/AuthContext";

const LEAVE_TYPES = [
  "AnnualLeave",
  "SickLeave",
  "FamilyResponsibility",
  "UnpaidLeave",
  "Other",
];

const LeaveWorkspace = () => {
  const { user } = useAuth();
  const [myLeaves, setMyLeaves] = useState([]);
  const [allLeaves, setAllLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adminError, setAdminError] = useState("");
  const ADMIN_ROLES = ["OWNER", "ADMIN", "MANAGER"];
  const [formState, setFormState] = useState({
    leaveType: "AnnualLeave",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const fileInputRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [approvingId, setApprovingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [expandedLeaveId, setExpandedLeaveId] = useState(null);

  const fetchLeaves = async () => {
    setLoading(true);
    setError("");
    setAdminError("");
    try {
      const myResponse = await ApiService.get("/leaves/my");
      setMyLeaves(myResponse.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load your leaves");
    }

    if (user && ADMIN_ROLES.includes(user.role)) {
      try {
        const adminResponse = await ApiService.get("/leaves");
        setAllLeaves(adminResponse.data);
      } catch (err) {
        setAdminError(err.response?.data?.message || "Unable to load tenant leaves");
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchLeaves();
    }
  }, [user]);

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    setUploadingFiles(true);
    try {
      const response = await ApiService.post("/leaves/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadedFiles((prev) => [...prev, ...response.data]);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to upload files");
    } finally {
      setUploadingFiles(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveFile = async (fileId) => {
    try {
      await ApiService.delete(`/leaves/file/${fileId}`);
      setUploadedFiles((prev) => prev.filter((file) => file.id !== fileId));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to remove file");
    }
  };

  const applyLeave = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await ApiService.post("/leaves", {
        ...formState,
        fileIds: uploadedFiles.map((file) => file.id),
      });
      setFormState({
        leaveType: "AnnualLeave",
        startDate: "",
        endDate: "",
        reason: "",
      });
      fetchLeaves();
      setUploadedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to submit leave");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (leaveId) => {
    setApprovingId(leaveId);
    try {
      await ApiService.put(`/leaves/${leaveId}/approve`);
      fetchLeaves();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to approve leave");
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (leaveId) => {
    if (!rejectionReason.trim()) {
      setError("Rejection reason is required");
      return;
    }
    setRejectingId(leaveId);
    try {
      await ApiService.put(`/leaves/${leaveId}/reject`, {
        rejectionReason,
      });
      setRejectionReason("");
      fetchLeaves();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to reject leave");
    } finally {
      setRejectingId(null);
    }
  };

  const leaveTrend = useMemo(() => {
    const counts = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
    const isAdmin = ADMIN_ROLES.includes(user?.role);
    const list = isAdmin ? allLeaves : myLeaves;
    list.forEach((leave) => {
      counts[leave.status] = (counts[leave.status] || 0) + 1;
    });
    return counts;
  }, [allLeaves, myLeaves, user]);

  if (!user) return null;

  const showAdminView = ADMIN_ROLES.includes(user.role);

  const leavesToShow = showAdminView ? allLeaves : myLeaves;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Apply for leave
          </h2>
          <form onSubmit={applyLeave} className="space-y-3 pt-3">
            <label className="text-sm text-gray-600 dark:text-gray-300">
              Type
              <select
                value={formState.leaveType}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    leaveType: event.target.value,
                  }))
                }
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                {LEAVE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm text-gray-600 dark:text-gray-300">
                Start date
                <input
                  type="date"
                  required
                  value={formState.startDate}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      startDate: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </label>
              <label className="text-sm text-gray-600 dark:text-gray-300">
                End date
                <input
                  type="date"
                  required
                  value={formState.endDate}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      endDate: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </label>
            </div>
            <label className="text-sm text-gray-600 dark:text-gray-300">
              Reason
              <textarea
                value={formState.reason}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, reason: event.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                rows={3}
                required
              />
            </label>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                Supporting documents (optional)
              </label>
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="text-sm text-gray-600 dark:text-gray-300"
                />
                {uploadingFiles && (
                  <span className="text-xs text-indigo-600">Uploading...</span>
                )}
              </div>
              {uploadedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700"
                    >
                      <span className="max-w-xs truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(file.id)}
                        className="text-indigo-500 hover:text-indigo-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Apply for leave"}
            </button>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </form>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Leave overview
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {Object.entries(leaveTrend).map(([status, value]) => (
              <div
                key={status}
                className="rounded-xl border border-gray-200 p-3 text-center dark:border-gray-700"
              >
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  {status.toLowerCase()}
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {showAdminView ? "All leave requests" : "My leave requests"}
          </h2>
          <p className="text-xs uppercase tracking-wide text-gray-500">
            {leavesToShow.length} results
          </p>
        </div>
        {showAdminView && adminError && (
          <p className="mt-2 text-sm text-red-600">{adminError}</p>
        )}
        {loading ? (
          <p className="py-6 text-center text-sm text-gray-500">Loading...</p>
        ) : leavesToShow.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">
            No leaves submitted yet.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm text-gray-600 dark:text-gray-300">
              <thead className="text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Dates</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Details</th>
                  {showAdminView && <th className="px-4 py-3">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {leavesToShow.map((leave) => {
                  const isOwnLeave = leave.userId === user.id;
                  console.log("Leave request:", leave);
                  console.log("Current user:", user);
                  console.log("Debug comparison:", {
                    leaveUserId: leave.userId,
                    currentUserId: user.id,
                    isOwnLeave: isOwnLeave,
                    leaveUserName: leave.user?.name,
                    currentUserName: user.name
                  });
                  const isAssignedApprover = leave.user?.reportsToId === user.id;
                  const isExpanded = expandedLeaveId === leave.id;
                  const detailColSpan = showAdminView ? 6 : 5;
                  return (
                    <React.Fragment key={leave.id}>
                      <tr
                        className="border-t border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900"
                      >
                        <td className="px-4 py-3 uppercase">{leave.leaveType}</td>
                        <td className="px-4 py-3">
                          <div>{leave.startDate}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {leave.endDate}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-white">
                            {leave.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {leave.user?.name || user.name}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setExpandedLeaveId((prev) =>
                                prev === leave.id ? null : leave.id
                              );
                            }}
                            className="text-xs font-semibold uppercase text-indigo-600 hover:text-indigo-800 dark:text-indigo-300"
                          >
                            {isExpanded ? "Hide details" : "Show details"}
                          </button>
                        </td>
                        {showAdminView && (
                          <td className="px-4 py-3">
                            {leave.status === "PENDING" ? (
                              isAssignedApprover && !isOwnLeave ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    disabled={approvingId === leave.id}
                                    onClick={() => handleApprove(leave.id)}
                                    className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                                  >
                                    {approvingId === leave.id ? "Approving…" : "Approve"}
                                  </button>
                                  <button
                                    disabled={rejectingId === leave.id}
                                    onClick={() => handleReject(leave.id)}
                                    className="rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                                  >
                                    {rejectingId === leave.id ? "Rejecting…" : "Reject"}
                                  </button>
                                </div>
                              ) : (
                                <p className="text-xs text-gray-500">
                                  {isOwnLeave
                                    ? "You cannot approve or reject your own leave request."
                                    : `Only ${leave.approver?.name || "the assigned approver"} can act on this request.`}
                                </p>
                              )
                            ) : null}

                            {leave.status === "REJECTED" && (
                              <p className="mt-1 text-xs text-gray-500">
                                {leave.rejectionReason}
                              </p>
                            )}
                          </td>
                        )}
                      </tr>
                      {isExpanded && (
                        <tr className="bg-gray-50 dark:bg-gray-900">
                          <td colSpan={detailColSpan} className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            <div className="flex flex-col gap-2">
                              <p>
                                <span className="font-semibold">Reason:</span>{" "}
                                {leave.reason}
                              </p>
                              {leave.emergencyContact && (
                                <p>
                                  <span className="font-semibold">
                                    Emergency contact:
                                  </span>{" "}
                                  {leave.emergencyContact}
                                </p>
                              )}
                              {leave.emergencyPhone && (
                                <p>
                                  <span className="font-semibold">
                                    Emergency phone:
                                  </span>{" "}
                                  {leave.emergencyPhone}
                                </p>
                              )}
                              <p>
                                <span className="font-semibold">
                                  Submitted at:
                                </span>{" "}
                                {new Date(leave.submittedAt).toLocaleString()}
                              </p>
                              {leave.attachments?.length > 0 && (
                                <div>
                                  <span className="font-semibold">
                                    Supporting documents:
                                  </span>
                                  <div className="mt-1 flex flex-wrap gap-2">
                                    {leave.attachments.map((file) => (
                                      <a
                                        key={file.id}
                                        href={file.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-700/40 dark:bg-indigo-900/40 dark:text-indigo-100"
                                      >
                                        {file.name}
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {leave.status === "PENDING" && (
                                <div className="mt-3 flex gap-2">
                                  {console.log("Rendering cancel section:", { isOwnLeave, leaveId: leave.id })}
                                  {isOwnLeave ? (
                                    <button
                                      onClick={async () => {
                                        try {
                                          await ApiService.post(`/leaves/${leave.id}/cancel`);
                                          toast.success("Leave cancelled successfully");
                                          fetchLeaves();
                                        } catch (err) {
                                          toast.error(
                                            err.response?.data?.message || "Failed to cancel leave"
                                          );
                                        }
                                      }}
                                      className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-red-500"
                                    >
                                      Cancel Leave
                                    </button>
                                  ) : (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      Only the leave requester can cancel this leave
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showAdminView && (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <label className="text-sm text-gray-600 dark:text-gray-300">
            Rejection reason (used for next reject)
            <textarea
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              rows={2}
            />
          </label>
        </section>
      )}
    </div>
  );
};

export default LeaveWorkspace;
