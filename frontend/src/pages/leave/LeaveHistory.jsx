import React, { useState, useEffect } from "react";
import {
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  PencilIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  TrashIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../contexts/AuthContext";
import { format, isAfter, subDays } from "date-fns";
import { ApiService, useApiInterceptors } from "../../api/web-api-service";

const LeaveHistory = () => {
  const { user } = useAuth();
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [expandedRequest, setExpandedRequest] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLeave, setEditingLeave] = useState(null);
  const [formData, setFormData] = useState({
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
    emergencyContact: "",
    emergencyPhone: "",
    supportingDocs: [],
  });
  const [fileUploading, setFileUploading] = useState(false);
  const [fileUploadError, setFileUploadError] = useState("");
  const [userBalances, setUserBalances] = useState({
    AnnualLeave: 0,
    SickLeave: 0,
    FamilyResponsibility: 0,
    UnpaidLeave: 0,
    Other: 0,
  });
  const [formErrors, setFormErrors] = useState({});

  useApiInterceptors();

  // Map display names to backend values
  const leaveTypeMapping = {
    "Annual Leave": "AnnualLeave",
    "Sick Leave": "SickLeave",
    "Family Responsibility": "FamilyResponsibility",
    "Unpaid Leave": "UnpaidLeave",
    Other: "Other",
  };

  // Reverse mapping for display
  const reverseLeaveTypeMapping = {
    AnnualLeave: "Annual Leave",
    SickLeave: "Sick Leave",
    FamilyResponsibility: "Family Responsibility",
    UnpaidLeave: "Unpaid Leave",
    Other: "Other",
  };

  // Fetch user's leave history and balances
  useEffect(() => {
    const fetchLeaveHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await ApiService.get("/leaves/my");
        if (user?.leaveBalances) {
          setUserBalances(user.leaveBalances);
        }
        const processedLeaves = response.data.map((leave) => ({
          ...leave,
          leaveType:
            reverseLeaveTypeMapping[leave.leaveType] || leave.leaveType,
          // The backend now properly includes actionedByUser
          actionedByUser: leave.actionedByUser || null,
        }));
        setLeaveHistory(processedLeaves);
        setFilteredLeaves(processedLeaves);
      } catch (err) {
        console.error("Error fetching leave history:", err);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to fetch leave history"
        );
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchLeaveHistory();
    }
  }, [user]);

  // Filter and search logic
  useEffect(() => {
    let result = [...leaveHistory];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (leave) =>
          (leave.leaveType && leave.leaveType.toLowerCase().includes(term)) ||
          (leave.reason && leave.reason.toLowerCase().includes(term)) ||
          (leave.user?.name && leave.user.name.toLowerCase().includes(term)) ||
          (leave.actionedByUser?.name &&
            leave.actionedByUser.name.toLowerCase().includes(term))
      );
    }
    if (filter !== "all") {
      result = result.filter(
        (leave) =>
          leave.status === filter ||
          leave.leaveType === filter ||
          leave.leaveType === leaveTypeMapping[filter]
      );
    }
    setFilteredLeaves(result);
  }, [searchTerm, filter, leaveHistory]);

  const toggleExpand = (id) => {
    setExpandedRequest(expandedRequest === id ? null : id);
  };

  const handleEditClick = (leave) => {
    const endDate = new Date(leave.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    if (leave.status !== "pending") {
      alert("You can only edit pending leave requests.");
      return;
    }
    if (isAfter(today, endDate)) {
      alert("You can only edit leave requests that haven't ended yet.");
      return;
    }
    setEditingLeave(leave);
    setFormData({
      leaveType: reverseLeaveTypeMapping[leave.leaveType] || leave.leaveType,
      startDate: leave.startDate.split("T")[0],
      endDate: leave.endDate.split("T")[0],
      reason: leave.reason || "",
      emergencyContact: leave.emergencyContact || "",
      emergencyPhone: leave.emergencyPhone || "",
      supportingDocs: leave.attachments || [],
    });
    setIsEditModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: "",
      });
    }
    if (name === "startDate" || name === "endDate") {
      if (formErrors.days) {
        setFormErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.days;
          return newErrors;
        });
      }
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.leaveType) errors.leaveType = "Leave type is required";
    if (!formData.startDate) errors.startDate = "Start date is required";
    if (!formData.endDate) errors.endDate = "End date is required";
    if (!formData.reason?.trim()) errors.reason = "Reason is required";
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (start > end) errors.endDate = "End date cannot be before start date";
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const backendLeaveType = leaveTypeMapping[formData.leaveType];
    if (backendLeaveType && userBalances[backendLeaveType] !== undefined) {
      if (days > userBalances[backendLeaveType]) {
        errors.days = `Insufficient ${formData.leaveType} balance. You have ${userBalances[backendLeaveType]} day(s) remaining.`;
      }
    }
    const overlapping = leaveHistory.some(
      (l) =>
        l.id !== editingLeave?.id &&
        l.status !== "rejected" &&
        l.status !== "cancelled" &&
        new Date(l.startDate) <= end &&
        new Date(l.endDate) >= start
    );
    if (overlapping) {
      errors.overlap =
        "This period overlaps with another active leave request.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateLeave = async () => {
    if (!validateForm()) return;
    setFileUploading(true);
    try {
      const backendLeaveType =
        leaveTypeMapping[formData.leaveType] || formData.leaveType;
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      const originalFileIds = editingLeave.attachments.map((file) => file.id);
      const currentFileIds = formData.supportingDocs.map((file) => file.id);
      const removeFileIds = originalFileIds.filter(
        (id) => !currentFileIds.includes(id)
      );
      const payload = {
        leaveType: backendLeaveType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason.trim(),
        emergencyContact: formData.emergencyContact || undefined,
        emergencyPhone: formData.emergencyPhone || undefined,
        fileIds: currentFileIds,
        removeFileIds: removeFileIds.length > 0 ? removeFileIds : undefined,
      };
      const response = await ApiService.put(
        `/leaves/${editingLeave.id}`,
        payload
      );
      const updatedLeaveWithDisplayName = {
        ...response.data,
        leaveType:
          reverseLeaveTypeMapping[response.data.leaveType] ||
          response.data.leaveType,
        // The backend now properly includes actionedByUser
        actionedByUser: response.data.actionedByUser || null,
      };
      setLeaveHistory((prev) =>
        prev.map((l) =>
          l.id === updatedLeaveWithDisplayName.id
            ? updatedLeaveWithDisplayName
            : l
        )
      );
      setIsEditModalOpen(false);
      setEditingLeave(null);
      setFormData({
        leaveType: "",
        startDate: "",
        endDate: "",
        reason: "",
        emergencyContact: "",
        emergencyPhone: "",
        supportingDocs: [],
      });
      setFormErrors({});
      alert("Leave request updated successfully!");
    } catch (err) {
      console.error("Error updating leave:", err);
      alert(
        `Failed to update leave: ${
          err.response?.data?.message || "Please try again later"
        }`
      );
    } finally {
      setFileUploading(false);
    }
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length + formData.supportingDocs.length > 5) {
      setFileUploadError("You can upload a maximum of 5 files");
      return;
    }
    setFileUploading(true);
    setFileUploadError("");
    try {
      const uploadFormData = new FormData();
      files.forEach((file) => {
        uploadFormData.append("files", file);
      });
      const response = await ApiService.post("/leaves/upload", uploadFormData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      const newFiles = response.data;
      setFormData((prev) => ({
        ...prev,
        supportingDocs: [...prev.supportingDocs, ...newFiles],
      }));
    } catch (err) {
      console.error("Error uploading files:", err);
      setFileUploadError(
        err.response?.data?.message ||
          "Failed to upload files. Please check file size and type."
      );
    } finally {
      setFileUploading(false);
    }
  };

  const removeFileFromRequest = (fileId) => {
    setFormData((prev) => ({
      ...prev,
      supportingDocs: prev.supportingDocs.filter((file) => file.id !== fileId),
    }));
  };

  const deleteFilePermanently = async (fileId) => {
    try {
      await ApiService.delete(`/leaves/file/${fileId}`);
      setFormData((prev) => ({
        ...prev,
        supportingDocs: prev.supportingDocs.filter(
          (file) => file.id !== fileId
        ),
      }));
    } catch (err) {
      console.error("Error deleting file:", err);
      setFileUploadError(
        err.response?.data?.message ||
          "Failed to delete file. Please try again."
      );
    }
  };

  const cancelLeave = async (id) => {
    if (
      !window.confirm("Are you sure you want to cancel this leave request?")
    ) {
      return;
    }
    try {
      await ApiService.put(`/leaves/${id}/cancel`);
      setLeaveHistory((prev) =>
        prev.map((leave) =>
          leave.id === id ? { ...leave, status: "cancelled" } : leave
        )
      );
      alert("Leave request cancelled successfully!");
    } catch (err) {
      console.error("Error cancelling leave:", err);
      alert(
        `Failed to cancel leave: ${
          err.response?.data?.message || "Please try again later"
        }`
      );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "Not specified";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case "rejected":
        return <XMarkIcon className="h-5 w-5 text-red-600" />;
      case "cancelled":
        return <XMarkIcon className="h-5 w-5 text-gray-600" />;
      case "pending":
        return <ClockIcon className="h-5 w-5 text-yellow-600" />;
      default:
        return <ClockIcon className="h-5 w-5 text-yellow-600" />;
    }
  };

  // Render actioned-by user information with better UI
  const renderActionedByInfo = (leave) => {
    if (leave.status === "pending" || leave.status === "cancelled") {
      return null;
    }

    const actionedBy = leave.actionedByUser;
    const actionText =
      leave.status === "approved" ? "Approved by" : "Rejected by";

    return (
      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center text-sm text-blue-800">
          <UserCircleIcon className="h-5 w-5 mr-2 text-blue-600" />
          <span className="font-semibold">{actionText}: </span>
          {actionedBy ? (
            <div className="ml-2 flex items-center">
              {actionedBy.avatar ? (
                <img
                  className="h-6 w-6 rounded-full mr-2 object-cover border border-blue-200"
                  src={actionedBy.avatar}
                  alt={actionedBy.name}
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/24?text=U";
                  }}
                />
              ) : (
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold mr-2">
                  {actionedBy.name?.charAt(0) || "A"}
                </div>
              )}
              <div>
                <span className="font-medium text-blue-900 block">
                  {actionedBy.name}
                </span>
                {(actionedBy.position || actionedBy.department) && (
                  <span className="text-blue-700 text-xs">
                    {actionedBy.position}
                    {actionedBy.position && actionedBy.department && " • "}
                    {actionedBy.department}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <span className="ml-2 text-blue-700">System Administrator</span>
          )}
        </div>
        {leave.status === "rejected" && leave.rejectionReason && (
          <div className="mt-2 text-sm">
            <span className="font-medium text-blue-800">Reason: </span>
            <span className="text-red-700 bg-red-50 px-2 py-1 rounded text-sm">
              {leave.rejectionReason}
            </span>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
          <p className="text-gray-600 ml-4">Loading leave history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      {user?.role === "admin" && (
        <div className="mb-6">
          <a
            href="/dashboard/leave"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-500 transition-colors duration-200"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-1" />
            Back to Dashboard
          </a>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Leave History</h1>
        <p className="mt-2 text-gray-600">
          View and manage your leave requests. Edit pending requests before they
          are approved.
        </p>
        {/* Leave Balances Display */}
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">
            Current Leave Balances:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {Object.entries(userBalances).map(([leaveType, balance]) => (
              <div
                key={leaveType}
                className="flex justify-between items-center bg-white px-3 py-2 rounded"
              >
                <span className="text-sm font-medium text-gray-700">
                  {reverseLeaveTypeMapping[leaveType] || leaveType}:
                </span>
                <span className="text-sm font-bold text-blue-600">
                  {balance} day{balance !== 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg mb-6 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Search by type, reason, approver, or date..."
            />
          </div>
          {/* Status Filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
              <option value="Annual Leave">Annual Leave</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Family Responsibility">
                Family Responsibility
              </option>
              <option value="Unpaid Leave">Unpaid Leave</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {filteredLeaves.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <ClockIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">
              No leave requests found
            </h3>
            <p className="mb-4">
              {filter === "all"
                ? "You haven't submitted any leave requests yet."
                : "No leave requests match your current filters."}
            </p>
            <button
              onClick={() => (window.location.href = "/dashboard/leave/new")}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Request New Leave
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredLeaves.map((leave) => (
              <li key={leave.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className={`flex-shrink-0 rounded-full p-1 ${
                          leave.status === "approved"
                            ? "bg-green-100"
                            : leave.status === "rejected"
                            ? "bg-red-100"
                            : leave.status === "cancelled"
                            ? "bg-gray-100"
                            : "bg-yellow-100"
                        }`}
                      >
                        {getStatusIcon(leave.status)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {leave.leaveType} - {leave.days} day
                          {leave.days !== 1 ? "s" : ""}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(leave.startDate)} to{" "}
                          {formatDate(leave.endDate)}
                        </div>
                        {/* Show who actioned the leave in the main list view */}
                        {leave.status !== "pending" && leave.actionedByUser && (
                          <div className="text-xs text-gray-500 mt-1">
                            {leave.status === "approved"
                              ? "Approved"
                              : "Rejected"}{" "}
                            by:{" "}
                            <span className="font-medium">
                              {leave.actionedByUser.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <div className="text-right mr-4">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            leave.status
                          )}`}
                        >
                          {leave.status.charAt(0).toUpperCase() +
                            leave.status.slice(1)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleExpand(leave.id)}
                        className="ml-2 flex-shrink-0 text-gray-400 hover:text-gray-500"
                      >
                        {expandedRequest === leave.id ? (
                          <ChevronUpIcon className="h-5 w-5" />
                        ) : (
                          <ChevronDownIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {expandedRequest === leave.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-700 mb-4">
                        <p className="font-medium">Reason:</p>
                        <p className="mt-1">{leave.reason}</p>
                      </div>

                      {leave.attachments && leave.attachments.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700">
                            Supporting Documents:
                          </p>
                          <ul className="mt-1 border border-gray-200 rounded-md divide-y divide-gray-200">
                            {leave.attachments.map((doc) => (
                              <li
                                key={doc.id}
                                className="pl-3 pr-4 py-3 flex items-center justify-between text-sm"
                              >
                                <div className="w-0 flex-1 flex items-center">
                                  <DocumentTextIcon
                                    className="flex-shrink-0 h-5 w-5 text-gray-400"
                                    aria-hidden="true"
                                  />
                                  <span className="ml-2 flex-1 w-0 truncate">
                                    {doc.name}
                                  </span>
                                  <span className="ml-2 text-xs text-gray-500">
                                    {(doc.size / (1024 * 1024)).toFixed(2)} MB
                                  </span>
                                </div>

                                <div className="ml-4 flex-shrink-0 space-x-3">
                                  {/* View Button */}
                                  <button
                                    type="button"
                                    className="font-medium text-indigo-600 hover:text-indigo-500"
                                    onClick={() =>
                                      window.open(doc.url, "_blank")
                                    }
                                  >
                                    View
                                  </button>

                                  {/* Optional Download Button */}
                                  <a
                                    href={doc.url}
                                    download
                                    className="font-medium text-gray-600 hover:text-gray-800"
                                  >
                                    Download
                                  </a>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="text-xs text-gray-500 mb-4">
                        <p>Submitted: {formatDateTime(leave.submittedAt)}</p>
                      </div>

                      {/* Render actioned by information */}
                      {renderActionedByInfo(leave)}

                      <div className="flex space-x-3">
                        {leave.status === "pending" && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleEditClick(leave)}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              <PencilIcon className="-ml-0.5 mr-2 h-4 w-4" />
                              Edit Request
                            </button>
                            <button
                              type="button"
                              onClick={() => cancelLeave(leave.id)}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              <XMarkIcon className="-ml-0.5 mr-2 h-4 w-4" />
                              Cancel Request
                            </button>
                          </>
                        )}
                        {leave.status === "cancelled" && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Cancelled
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Edit Leave Request
                </h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Leave Type *
                    </label>
                    <select
                      name="leaveType"
                      value={formData.leaveType}
                      onChange={handleInputChange}
                      className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                        formErrors.leaveType
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    >
                      <option value="">Select leave type</option>
                      {Object.entries(userBalances).map(
                        ([backendType, balance]) => {
                          const displayName =
                            reverseLeaveTypeMapping[backendType] || backendType;
                          return (
                            <option key={backendType} value={displayName}>
                              {displayName} ({balance} days remaining)
                              {balance <= 0 && backendType !== "UnpaidLeave"
                                ? " - EXHAUSTED"
                                : ""}
                            </option>
                          );
                        }
                      )}
                    </select>
                    {formErrors.leaveType && (
                      <p className="mt-1 text-sm text-red-600">
                        {formErrors.leaveType}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split("T")[0]}
                      className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                        formErrors.startDate
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    {formErrors.startDate && (
                      <p className="mt-1 text-sm text-red-600">
                        {formErrors.startDate}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date *
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      min={
                        formData.startDate ||
                        new Date().toISOString().split("T")[0]
                      }
                      className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                        formErrors.endDate
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    {formErrors.endDate && (
                      <p className="mt-1 text-sm text-red-600">
                        {formErrors.endDate}
                      </p>
                    )}
                    {formErrors.days && (
                      <p className="mt-1 text-sm text-red-600">
                        {formErrors.days}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Days
                    </label>
                    <input
                      type="number"
                      readOnly
                      value={
                        formData.startDate && formData.endDate
                          ? Math.ceil(
                              (new Date(formData.endDate) -
                                new Date(formData.startDate)) /
                                (1000 * 60 * 60 * 24)
                            ) + 1
                          : ""
                      }
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Emergency Contact
                    </label>
                    <input
                      type="text"
                      name="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Emergency Phone
                    </label>
                    <input
                      type="tel"
                      name="emergencyPhone"
                      value={formData.emergencyPhone}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason *
                  </label>
                  <textarea
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    rows={4}
                    className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                      formErrors.reason ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {formErrors.reason && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.reason}
                    </p>
                  )}
                  {formErrors.overlap && (
                    <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <div className="flex items-start">
                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
                        <p className="text-sm text-yellow-800">
                          {formErrors.overlap}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supporting Documents (Optional)
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="space-y-1 text-center">
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        disabled={fileUploading}
                        className="sr-only"
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                      >
                        <span className="block">Upload files</span>
                        <span className="block text-sm text-gray-500">
                          PDF, DOC, JPG, PNG up to 10MB (max 5 files)
                        </span>
                      </label>
                      <p className="text-xs text-gray-500">
                        Drag and drop or click to upload
                      </p>
                      {fileUploading && (
                        <div className="flex items-center justify-center">
                          <svg
                            className="animate-spin h-4 w-4 mr-2 text-indigo-500"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          <p className="text-xs text-indigo-500">
                            Uploading...
                          </p>
                        </div>
                      )}
                      {fileUploadError && (
                        <p className="text-xs text-red-500">
                          {fileUploadError}
                        </p>
                      )}
                    </div>
                  </div>
                  {formData.supportingDocs.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Uploaded Documents
                      </h4>
                      <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                        {formData.supportingDocs.map((doc) => (
                          <li
                            key={doc.id}
                            className="pl-3 pr-4 py-3 flex items-center justify-between text-sm"
                          >
                            <div className="w-0 flex-1 flex items-center">
                              <DocumentTextIcon className="flex-shrink-0 h-5 w-5 text-gray-400" />
                              <span className="ml-2 flex-1 w-0 truncate">
                                {doc.name}
                              </span>
                              <span className="ml-2 text-xs text-gray-500">
                                {(doc.size / (1024 * 1024)).toFixed(2)} MB
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => removeFileFromRequest(doc.id)}
                                className="flex-shrink-0 text-gray-600 hover:text-gray-500"
                                title="Remove from this request"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteFilePermanently(doc.id)}
                                className="flex-shrink-0 text-red-600 hover:text-red-500"
                                title="Delete permanently"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-xs text-gray-500">
                        Use the X icon to remove from this request, or the trash
                        icon to delete permanently.
                      </p>
                    </div>
                  )}
                </div>
                <div className="mt-8 flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    onClick={handleUpdateLeave}
                    disabled={fileUploading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {fileUploading ? (
                      <div className="flex items-center">
                        <svg
                          className="animate-spin h-4 w-4 mr-2 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Saving...
                      </div>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveHistory;
