import React, { useState, useEffect } from "react";
import {
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentTextIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ClockIcon,
  UserIcon,
  ArrowLeftIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import LeaveHistory from "../leave/LeaveHistory";
import { useAuth } from "../../contexts/AuthContext";

const LeaveApprovals = () => {
  const [currentView, setCurrentView] = useState("approvals"); // "approvals" or "history"
  const [leaves, setLeaves] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [expandedRequest, setExpandedRequest] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all"); // all, pending, approved, rejected
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leaveTypes, setLeaveTypes] = useState([
    "Annual Leave",
    "Sick Leave",
    "Family Responsibility",
    "Unpaid Leave",
    "Other",
  ]);

  const { user } = useAuth();

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

  // Fetch all leave requests from API (excluding admin's own leaves)
  useEffect(() => {
    if (currentView !== "approvals") return;

    const fetchLeaves = async () => {
      setLoading(true);
      setError(null);
      try {
        const token =
          localStorage.getItem("authToken") ||
          sessionStorage.getItem("authToken");
        if (!token) {
          throw new Error("Authentication token not found");
        }

        const response = await fetch("http://localhost:5000/api/leaves", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "Failed to fetch leave requests"
          );
        }

        const data = await response.json();

        // Get current user ID from auth context
        const currentUserId = user?.id;

        // Filter out the current user's leaves to prevent self-approval
        const filteredData = data.filter(
          (leave) => leave.userId !== currentUserId
        );

        // Convert backend leave types to display names
        const processedData = filteredData.map((leave) => ({
          ...leave,
          leaveType:
            reverseLeaveTypeMapping[leave.leaveType] || leave.leaveType,
        }));

        setLeaves(processedData);
        setFilteredLeaves(processedData);
      } catch (err) {
        console.error("Error fetching leaves:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaves();
  }, [currentView, user]);

  // Filter leaves based on search term and status
  useEffect(() => {
    if (currentView !== "approvals") return;

    let result = [...leaves];

    // Search by employee name, leave type, reason
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (leave) =>
          (leave.user?.name && leave.user.name.toLowerCase().includes(term)) ||
          (leave.leaveType && leave.leaveType.toLowerCase().includes(term)) ||
          (leave.reason && leave.reason.toLowerCase().includes(term)) ||
          (leave.user?.department &&
            leave.user.department.toLowerCase().includes(term)) ||
          (leave.user?.position &&
            leave.user.position.toLowerCase().includes(term))
      );
    }

    // Filter by status
    if (filter !== "all") {
      result = result.filter((leave) => leave.status.toLowerCase() === filter);
    }

    setFilteredLeaves(result);
  }, [searchTerm, filter, leaves, currentView]);

  const toggleView = (view) => {
    setCurrentView(view);
    // Reset states when switching views
    setSearchTerm("");
    setFilter("all");
    setExpandedRequest(null);
  };

  const toggleExpand = (id) => {
    if (expandedRequest === id) {
      setExpandedRequest(null);
    } else {
      setExpandedRequest(id);
    }
  };

  const handleApprove = async (id) => {
    if (
      !window.confirm("Are you sure you want to approve this leave request?")
    ) {
      return;
    }

    try {
      const token =
        localStorage.getItem("authToken") ||
        sessionStorage.getItem("authToken");
      const response = await fetch(
        `http://localhost:5000/api/leaves/${id}/approve`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to approve leave request");
      }

      const updatedLeave = await response.json();

      // Convert backend leave type to display name
      const processedLeave = {
        ...updatedLeave.leave,
        leaveType:
          reverseLeaveTypeMapping[updatedLeave.leave.leaveType] ||
          updatedLeave.leave.leaveType,
      };

      // Update local state
      setLeaves((prev) =>
        prev.map((leave) => (leave.id === id ? processedLeave : leave))
      );

      alert("Leave request approved successfully!");
    } catch (err) {
      console.error("Error approving leave:", err);
      alert(`Failed to approve leave: ${err.message}`);
    }
  };

  const handleReject = async (id) => {
    const reason = prompt("Please enter the reason for rejection:");
    if (!reason || reason.trim() === "") return;

    try {
      const token =
        localStorage.getItem("authToken") ||
        sessionStorage.getItem("authToken");
      const response = await fetch(
        `http://localhost:5000/api/leaves/${id}/reject`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ rejectionReason: reason.trim() }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to reject leave request");
      }

      const updatedLeave = await response.json();

      // Convert backend leave type to display name
      const processedLeave = {
        ...updatedLeave,
        leaveType:
          reverseLeaveTypeMapping[updatedLeave.leaveType] ||
          updatedLeave.leaveType,
      };

      // Update local state
      setLeaves((prev) =>
        prev.map((leave) =>
          leave.id === id
            ? {
                ...processedLeave,
                status: "rejected",
                rejectionReason: reason.trim(),
              }
            : leave
        )
      );
      alert("Leave request rejected successfully!");
    } catch (err) {
      console.error("Error rejecting leave:", err);
      alert(`Failed to reject leave: ${err.message}`);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "Not specified";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
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
      case "pending":
        return <ClockIcon className="h-5 w-5 text-yellow-600" />;
      case "cancelled":
        return <XMarkIcon className="h-5 w-5 text-gray-600" />;
      default:
        return <ClockIcon className="h-5 w-5 text-yellow-600" />;
    }
  };

  // If viewing history, render the LeaveHistory component
  if (currentView === "history") {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Render LeaveHistory component */}
        <LeaveHistory />
      </div>
    );
  }

  // Loading and error states for approvals view
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
            <p className="text-gray-600 text-lg">Loading leave requests...</p>
          </div>
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
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main approvals view
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with view toggle */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Leave Approvals
            </h1>
            <p className="mt-2 text-gray-600">
              Review and manage all leave requests — approve, reject, or view
              your leave history
            </p>
          </div>

          <button
            onClick={() => toggleView("history")}
            className="inline-flex items-center px-5 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:scale-105"
          >
            <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
            View My Leave History
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <ClockIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {leaves.filter((l) => l.status === "pending").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <CheckCircleIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">
                {leaves.filter((l) => l.status === "approved").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <XMarkIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-gray-900">
                {leaves.filter((l) => l.status === "rejected").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-gray-100 text-gray-600">
              <UserIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Requests
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {leaves.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-200 mb-8 p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Search */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200"
              placeholder="Search by name, department, leave type, or reason..."
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="block w-full pl-12 pr-10 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200 appearance-none bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <ChevronDownIcon className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">
            Leave Requests ({filteredLeaves.length})
          </h2>
        </div>

        {filteredLeaves.length === 0 ? (
          <div className="p-16 text-center">
            <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No leave requests found
            </h3>
            <p className="text-gray-500 mb-6">
              Try adjusting your search or filter criteria.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setFilter("all")}
                className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors duration-200"
              >
                Clear Filters
              </button>
              <button
                onClick={() => setSearchTerm("")}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
              >
                Clear Search
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredLeaves.map((leave) => (
              <div
                key={leave.id}
                className="group hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="px-6 py-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0 space-x-4">
                      <div className="flex-shrink-0">
                        {leave.user?.avatar ? (
                          <img
                            className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-sm"
                            src={leave.user.avatar}
                            alt={leave.user.name}
                            onError={(e) => {
                              e.target.src =
                                "https://via.placeholder.com/150?text=User";
                            }}
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                            {leave.user?.name?.charAt(0) || "U"}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {leave.user?.name || "Unknown User"}
                          </h3>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              leave.status
                            )}`}
                          >
                            {getStatusIcon(leave.status)}
                            <span className="ml-1 capitalize">
                              {leave.status}
                            </span>
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          <span className="font-medium">
                            {leave.user?.department || "Unknown Dept"}
                          </span>
                          {leave.user?.position && (
                            <>
                              {" • "}
                              <span>{leave.user?.position}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {leave.leaveType}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(leave.startDate)} to{" "}
                          {formatDate(leave.endDate)}
                          <span className="mx-1">•</span>
                          {leave.days} day{leave.days !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleExpand(leave.id)}
                        className="ml-2 flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200 group-hover:bg-gray-100"
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
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                          <div className="mb-6">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                              Reason
                            </h4>
                            <p className="text-sm text-gray-900 bg-gray-50 p-4 rounded-lg border border-gray-200">
                              {leave.reason}
                            </p>
                          </div>

                          {leave.attachments &&
                            leave.attachments.length > 0 && (
                              <div className="mb-6">
                                <h4 className="text-sm font-medium text-gray-700 mb-3">
                                  Supporting Documents
                                </h4>
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                  {leave.attachments.map((doc) => (
                                    <div
                                      key={doc.id}
                                      className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0"
                                    >
                                      <div className="flex items-center space-x-3">
                                        <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                                        <div className="min-w-0">
                                          <p className="text-sm font-medium text-gray-900 truncate">
                                            {doc.name}
                                          </p>
                                          <p className="text-xs text-gray-500">
                                            {(doc.size / 1024).toFixed(1)} KB •{" "}
                                            {doc.type}
                                          </p>
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
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
                                  ))}
                                </div>
                              </div>
                            )}
                        </div>

                        <div className="space-y-4">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">
                              Request Details
                            </h4>
                            <div className="space-y-3 text-sm">
                              <div>
                                <span className="text-gray-500">
                                  Submitted:
                                </span>
                                <p className="font-medium text-gray-900">
                                  {formatDateTime(leave.submittedAt)}
                                </p>
                              </div>
                              {leave.approvedAt && (
                                <div>
                                  <span className="text-gray-500">
                                    Approved:
                                  </span>
                                  <p className="font-medium text-gray-900">
                                    {formatDateTime(leave.approvedAt)}
                                  </p>
                                </div>
                              )}
                              {leave.rejectionReason && (
                                <div>
                                  <span className="text-gray-500">
                                    Rejection Reason:
                                  </span>
                                  <p className="font-medium text-red-600 bg-red-50 p-2 rounded mt-1">
                                    {leave.rejectionReason}
                                  </p>
                                </div>
                              )}
                              {leave.emergencyContact && (
                                <div>
                                  <span className="text-gray-500">
                                    Emergency Contact:
                                  </span>
                                  <p className="font-medium text-gray-900">
                                    {leave.emergencyContact}
                                  </p>
                                </div>
                              )}
                              {leave.emergencyPhone && (
                                <div>
                                  <span className="text-gray-500">
                                    Emergency Phone:
                                  </span>
                                  <p className="font-medium text-gray-900">
                                    {leave.emergencyPhone}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {leave.status === "pending" && (
                            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                              <h4 className="text-sm font-medium text-gray-700 mb-4">
                                Actions
                              </h4>
                              <div className="space-y-3">
                                <button
                                  type="button"
                                  onClick={() => handleApprove(leave.id)}
                                  className="w-full inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 transform hover:scale-105"
                                >
                                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                                  Approve Request
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleReject(leave.id)}
                                  className="w-full inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 transform hover:scale-105"
                                >
                                  <XMarkIcon className="h-5 w-5 mr-2" />
                                  Reject Request
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveApprovals;
