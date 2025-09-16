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
} from "@heroicons/react/24/outline";
import { useAuth } from "../../contexts/AuthContext";
import { format, isAfter, subDays } from "date-fns";

const LeaveHistory = () => {
  const { user, logout } = useAuth();
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
  const [userBalance, setUserBalance] = useState(0);
  const [formErrors, setFormErrors] = useState({});

  // Fetch user's leave history and balance
  useEffect(() => {
    const fetchLeaveHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          throw new Error("Authentication token not found");
        }

        // Fetch leave history
        const leavesResponse = await fetch(
          "http://localhost:5000/api/leaves/my",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!leavesResponse.ok) {
          const errorData = await leavesResponse.json();
          throw new Error(errorData.message || "Failed to fetch leave history");
        }

        const leaves = await leavesResponse.json();

        // Fetch user profile to get leave balance

        const userData = await user;
        setUserBalance(userData.leaveBalance);

        setLeaveHistory(leaves);
        setFilteredLeaves(leaves);
      } catch (err) {
        console.error("Error fetching leave history:", err);
        setError(err.message);
        if (err.message.includes("Authentication token")) {
          logout(); // Redirect to login if token invalid
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveHistory();
  }, [logout]);

  // Filter and search logic
  useEffect(() => {
    let result = [...leaveHistory];

    // Search by leave type, reason, or date
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (leave) =>
          leave.leaveType.toLowerCase().includes(term) ||
          leave.reason.toLowerCase().includes(term) ||
          leave.user?.name.toLowerCase().includes(term)
      );
    }

    // Filter by status or leave type
    if (filter !== "all") {
      result = result.filter(
        (leave) => leave.status === filter || leave.leaveType === filter
      );
    }

    setFilteredLeaves(result);
  }, [searchTerm, filter, leaveHistory]);

  const toggleExpand = (id) => {
    if (expandedRequest === id) {
      setExpandedRequest(null);
    } else {
      setExpandedRequest(id);
    }
  };

  const handleEditClick = (leave) => {
    // Only allow editing if pending and end date is today or in future
    const endDate = new Date(leave.endDate);
    const today = new Date();
    if (leave.status !== "pending" || isAfter(today, endDate)) {
      alert("You can only edit pending leave requests that haven't ended yet.");
      return;
    }

    setEditingLeave(leave);
    setFormData({
      leaveType: leave.leaveType,
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

    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.leaveType) errors.leaveType = "Leave type is required";
    if (!formData.startDate) errors.startDate = "Start date is required";
    if (!formData.endDate) errors.endDate = "End date is required";
    if (!formData.reason) errors.reason = "Reason is required";

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);

    if (start > end) errors.endDate = "End date cannot be before start date";

    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    if (days > userBalance) {
      errors.days = `Insufficient leave balance. You have ${userBalance} day(s) remaining.`;
    }

    // Check for overlapping leaves (frontend hint — backend still enforces)
    const overlapping = leaveHistory.some(
      (l) =>
        l.id !== editingLeave.id &&
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
      const token = localStorage.getItem("authToken");
      const payload = {
        leaveType: formData.leaveType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason,
        emergencyContact: formData.emergencyContact,
        emergencyPhone: formData.emergencyPhone,
        fileIds: formData.supportingDocs.map((doc) => doc.id),
      };

      const response = await fetch(
        `http://localhost:5000/api/leaves/${editingLeave.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update leave request");
      }

      const updatedLeave = await response.json();
      setLeaveHistory((prev) =>
        prev.map((l) => (l.id === updatedLeave.id ? updatedLeave : l))
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
      alert(`Failed to update leave: ${err.message}`);
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
      const token = localStorage.getItem("authToken");
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("http://localhost:5000/api/leaves/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload files");
      }

      const uploadedFiles = await response.json();

      setFormData((prev) => ({
        ...prev,
        supportingDocs: [...prev.supportingDocs, ...uploadedFiles],
      }));
    } catch (err) {
      setFileUploadError(err.message);
    } finally {
      setFileUploading(false);
    }
  };

  const removeFile = async (fileId) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `http://localhost:5000/api/leaves/files/${fileId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete file");
      }

      setFormData((prev) => ({
        ...prev,
        supportingDocs: prev.supportingDocs.filter(
          (file) => file.id !== fileId
        ),
      }));
    } catch (err) {
      console.error("Error deleting file:", err);
      setFileUploadError("Failed to delete file: " + err.message);
    }
  };

  const cancelLeave = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this leave request?"))
      return;

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `http://localhost:5000/api/leaves/${id}/cancel`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to cancel leave");
      }

      setLeaveHistory((prev) =>
        prev.map((leave) =>
          leave.id === id ? { ...leave, status: "cancelled" } : leave
        )
      );
    } catch (err) {
      console.error("Error cancelling leave:", err);
      alert(`Failed to cancel leave: ${err.message}`);
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-600">Loading leave history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XMarkIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
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
            href="/dashboard"
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
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 inline-block">
          <p className="text-sm text-blue-800">
            <strong>Current Leave Balance:</strong> {userBalance} day
            {userBalance !== 1 ? "s" : ""}
          </p>
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
              placeholder="Search by type, reason, or date..."
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
              You haven't submitted any leave requests yet.
            </p>
            <button
              onClick={() => (window.location.href = "/leave/new")}
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
                                    {(doc.size / 1024).toFixed(1)} KB
                                  </span>
                                </div>
                                <div className="ml-4 flex-shrink-0">
                                  <button
                                    type="button"
                                    className="font-medium text-indigo-600 hover:text-indigo-500"
                                    onClick={() =>
                                      window.open(
                                        `http://localhost:5000${doc.url}`,
                                        "_blank"
                                      )
                                    }
                                  >
                                    View
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="text-xs text-gray-500 mb-4">
                        <p>Submitted: {formatDateTime(leave.submittedAt)}</p>
                        {leave.approvedAt && (
                          <p>
                            Approved: {formatDateTime(leave.approvedAt)} by{" "}
                            {leave.approvedBy || "System"}
                          </p>
                        )}
                        {leave.rejectionReason && (
                          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded">
                            <strong className="text-red-800">
                              Rejection Reason:
                            </strong>{" "}
                            {leave.rejectionReason}
                          </div>
                        )}
                      </div>

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
                      <option value="Annual Leave">Annual Leave</option>
                      <option value="Sick Leave">Sick Leave</option>
                      <option value="Family Responsibility">
                        Family Responsibility
                      </option>
                      <option value="Unpaid Leave">Unpaid Leave</option>
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
                        <p className="text-xs text-indigo-500">Uploading...</p>
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
                                {(doc.size / 1024).toFixed(1)} KB
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(doc.id)}
                              className="ml-4 flex-shrink-0 text-red-600 hover:text-red-500"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
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
                    {fileUploading ? "Saving..." : "Save Changes"}
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
