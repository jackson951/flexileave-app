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

  const { user } = useAuth();

  // Fetch all leave requests from API (excluding admin's own leaves)
  useEffect(() => {
    if (currentView !== "approvals") return;

    const fetchLeaves = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("authToken");
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

        setLeaves(filteredData);
        setFilteredLeaves(filteredData);
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
          leave.user?.name.toLowerCase().includes(term) ||
          leave.leaveType.toLowerCase().includes(term) ||
          leave.reason.toLowerCase().includes(term)
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
    try {
      const token = localStorage.getItem("authToken");
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

      // Update local state
      setLeaves((prev) =>
        prev.map((leave) =>
          leave.id === id ? { ...leave, status: "approved" } : leave
        )
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
      const token = localStorage.getItem("authToken");
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

      // Update local state
      setLeaves((prev) =>
        prev.map((leave) =>
          leave.id === id
            ? { ...leave, status: "rejected", rejectionReason: reason.trim() }
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
        {/* Header with back button */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => toggleView("approvals")}
              className="mr-4 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Approvals
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                My Leave History
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                View your personal leave requests and their status
              </p>
            </div>
          </div>
        </div>

        {/* Render LeaveHistory component */}
        <LeaveHistory />
      </div>
    );
  }

  // Loading and error states for approvals view
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-600">Loading leave requests...</p>
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

  // Main approvals view
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with view toggle */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Approvals</h1>
          <p className="mt-1 text-sm text-gray-500">
            Review and manage all leave requests — approve, reject, or view
            history
          </p>
        </div>

        <button
          onClick={() => toggleView("history")}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
          View My Leave History
        </button>
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
              placeholder="Search by name, type, or reason..."
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
            </select>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {filteredLeaves.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <UserIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">
              No leave requests found
            </h3>
            <p>Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredLeaves.map((leave) => (
              <li key={leave.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0">
                      <div className="flex-shrink-0">
                        {leave.user?.avatar ? (
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={leave.user.avatar}
                            alt={leave.user.name}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-600 font-medium text-sm">
                              {leave.user?.name?.charAt(0) || "U"}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4 min-w-0">
                        <div className="text-sm font-medium text-indigo-600 truncate">
                          {leave.user?.name || "Unknown User"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {leave.user?.department || "Unknown"} •{" "}
                          {leave.user?.position || "Unknown"}
                        </div>
                      </div>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <div className="text-right mr-4">
                        <p className="text-sm font-medium text-gray-900">
                          {leave.leaveType}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(leave.startDate)} to{" "}
                          {formatDate(leave.endDate)} ({leave.days} day
                          {leave.days !== 1 ? "s" : ""})
                        </p>
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
                        Submitted: {formatDateTime(leave.submittedAt)}
                        {leave.approvedAt && (
                          <>
                            {" • "}Approved: {formatDateTime(leave.approvedAt)}
                          </>
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
                              onClick={() => handleApprove(leave.id)}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              <CheckCircleIcon
                                className="-ml-0.5 mr-2 h-4 w-4"
                                aria-hidden="true"
                              />
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReject(leave.id)}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              <XMarkIcon
                                className="-ml-0.5 mr-2 h-4 w-4"
                                aria-hidden="true"
                              />
                              Reject
                            </button>
                          </>
                        )}

                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            leave.status
                          )}`}
                        >
                          {getStatusIcon(leave.status)}
                          <span className="ml-1 capitalize">
                            {leave.status}
                          </span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default LeaveApprovals;
