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
  ArrowPathIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import LeaveHistory from "../leave/LeaveHistory";
import { useAuth } from "../../contexts/AuthContext";
import { ApiService, useApiInterceptors } from "../../api/web-api-service";
import { formatDistanceToNow } from "date-fns";

const LeaveApprovals = () => {
  const [currentView, setCurrentView] = useState("approvals");
  const [leaves, setLeaves] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [expandedRequest, setExpandedRequest] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useApiInterceptors();
  const { user } = useAuth();

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  const leaveTypeMapping = {
    "Annual Leave": "AnnualLeave",
    "Sick Leave": "SickLeave",
    "Family Responsibility": "FamilyResponsibility",
    "Unpaid Leave": "UnpaidLeave",
    Other: "Other",
  };

  const reverseLeaveTypeMapping = {
    AnnualLeave: "Annual Leave",
    SickLeave: "Sick Leave",
    FamilyResponsibility: "Family Responsibility",
    UnpaidLeave: "Unpaid Leave",
    Other: "Other",
  };

  const fetchLeaves = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await ApiService.get("/leaves");
      let filteredData;

      // Admins see ALL leaves (including their own)
      // Non-admins see only others' leaves
      if (user?.role === "admin") {
        filteredData = response.data;
      } else {
        filteredData = response.data.filter(
          (leave) => leave.userId !== user?.id
        );
      }

      const processedData = filteredData.map((leave) => ({
        ...leave,
        leaveType: reverseLeaveTypeMapping[leave.leaveType] || leave.leaveType,
        actionedByUser: leave.actionedByUser || null,
      }));

      setLeaves(processedData);
      setFilteredLeaves(processedData);
    } catch (err) {
      console.error("Error fetching leaves:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch leave requests";
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const createNotification = async (leaveId, userId, type, message, title) => {
    try {
      await ApiService.post("/notifications", {
        userId,
        type,
        message,
        title, // Add the title field
        leaveId,
      });
    } catch (error) {
      console.error("Error creating notification:", error);
    }
  };

  useEffect(() => {
    if (currentView === "approvals") {
      fetchLeaves();
    }
  }, [currentView, user]);

  useEffect(() => {
    if (currentView !== "approvals") return;

    let result = [...leaves];

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
            leave.user.position.toLowerCase().includes(term)) ||
          (leave.actionedByUser?.name &&
            leave.actionedByUser.name.toLowerCase().includes(term))
      );
    }

    if (filter !== "all") {
      result = result.filter((leave) => leave.status.toLowerCase() === filter);
    }

    setFilteredLeaves(result);
  }, [searchTerm, filter, leaves, currentView]);

  const toggleView = (view) => {
    setCurrentView(view);
    setSearchTerm("");
    setFilter("all");
    setExpandedRequest(null);
  };

  const toggleExpand = (id) => {
    setExpandedRequest(expandedRequest === id ? null : id);
  };

  // In the handleApprove function:
  const handleApprove = async (id) => {
    if (!window.confirm("Approve this leave request?")) return;

    try {
      const response = await ApiService.put(`/leaves/${id}/approve`);
      const processedLeave = {
        ...response.data.leave,
        leaveType:
          reverseLeaveTypeMapping[response.data.leave.leaveType] ||
          response.data.leave.leaveType,
        actionedByUser: response.data.leave.actionedByUser,
      };
      setLeaves((prev) =>
        prev.map((leave) => (leave.id === id ? processedLeave : leave))
      );

      // Create approval notification for the requester
      const leave = leaves.find((l) => l.id === id);
      if (leave) {
        await createNotification(
          id,
          leave.userId,
          "leave_approved",
          `Your leave request for ${formatDate(
            leave.startDate
          )} to ${formatDate(leave.endDate)} has been approved`,
          "Leave Request Approved" // Add title here
        );
      }

      alert("Leave request approved successfully!");
    } catch (err) {
      console.error("Error approving leave:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to approve leave request";
      alert(`Failed to approve leave: ${errorMessage}`);
    }
  };

  const handleReject = async (id) => {
    const reason = prompt("Reason for rejection:");
    if (!reason?.trim()) {
      alert("Rejection reason is required.");
      return;
    }

    try {
      const response = await ApiService.put(`/leaves/${id}/reject`, {
        rejectionReason: reason.trim(),
      });
      const processedLeave = {
        ...response.data,
        leaveType:
          reverseLeaveTypeMapping[response.data.leaveType] ||
          response.data.leaveType,
        actionedByUser: response.data.actionedByUser,
        status: "rejected",
        rejectionReason: reason.trim(),
      };
      setLeaves((prev) =>
        prev.map((leave) => (leave.id === id ? processedLeave : leave))
      );

      // Create rejection notification for the requester
      const leave = leaves.find((l) => l.id === id);
      if (leave) {
        await createNotification(
          id,
          leave.userId,
          "leave_rejected",
          `Your leave request for ${formatDate(
            leave.startDate
          )} to ${formatDate(
            leave.endDate
          )} has been rejected. Reason: ${reason}`,
          "Leave Request Rejected"
        );
      }

      alert("Leave request rejected successfully!");
    } catch (err) {
      console.error("Error rejecting leave:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to reject leave request";
      alert(`Failed to reject leave: ${errorMessage}`);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
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

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLeaves();
  };

  const isOwnRequest = (leave) => {
    return leave.userId === user?.id;
  };

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
      </div>
    );
  };

  if (currentView === "history") {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LeaveHistory />
      </div>
    );
  }

  if (loading && !refreshing) {
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
              <button
                onClick={handleRefresh}
                className="mt-3 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
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
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Leave Approvals
            </h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
              {user?.role === "admin"
                ? "Review all leave requests (including your own)"
                : "Review and manage leave requests from team members"}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center px-4 py-2.5 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 disabled:opacity-50"
            >
              <ArrowPathIcon
                className={`h-5 w-5 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              {isMobile ? "Refresh" : "Refresh Data"}
            </button>
            <button
              onClick={() => toggleView("history")}
              className="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
            >
              <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
              {isMobile ? "My History" : "View My History"}
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6 sm:mb-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 overflow-x-auto pb-2 -mx-4 px-4">
          <div className="bg-white rounded-lg shadow-xs border border-gray-200 p-4 min-w-[150px]">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                <ClockIcon className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Pending
                </p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {leaves.filter((l) => l.status === "pending").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-xs border border-gray-200 p-4 min-w-[150px]">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-green-100 text-green-600">
                <CheckCircleIcon className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Approved
                </p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {leaves.filter((l) => l.status === "approved").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-xs border border-gray-200 p-4 min-w-[150px]">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-red-100 text-red-600">
                <XMarkIcon className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Rejected
                </p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {leaves.filter((l) => l.status === "rejected").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-xs border border-gray-200 p-4 min-w-[150px]">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-gray-100 text-gray-600">
                <UserIcon className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Total
                </p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {leaves.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-xs rounded-xl border border-gray-200 mb-6 sm:mb-8 p-4 sm:p-6">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base transition-all duration-200"
              placeholder={
                isMobile
                  ? "Search requests..."
                  : "Search by name, department, leave type, or reason..."
              }
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base transition-all duration-200 appearance-none bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <ChevronDownIcon className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-xs rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">
            Leave Requests ({filteredLeaves.length})
          </h2>
          {refreshing && (
            <div className="flex items-center text-sm text-gray-500">
              <ArrowPathIcon className="h-4 w-4 mr-1 animate-spin" />
              Refreshing...
            </div>
          )}
        </div>

        {filteredLeaves.length === 0 ? (
          <div className="p-8 sm:p-16 text-center">
            <div className="mx-auto h-20 w-20 text-gray-400 mb-4">
              <DocumentTextIcon className="h-full w-full" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No leave requests found
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || filter !== "all"
                ? "Try adjusting your search or filter"
                : "No leave requests to display at this time"}
            </p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => setFilter("all")}
                className="px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors duration-200"
              >
                Reset Filters
              </button>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Clear Search
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredLeaves.map((leave) => (
              <div
                key={leave.id}
                className="group hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="px-4 sm:px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0 space-x-3 sm:space-x-4">
                      <div className="flex-shrink-0">
                        {leave.user?.avatar ? (
                          <img
                            className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover border-2 border-white shadow-sm"
                            src={leave.user.avatar}
                            alt={leave.user.name}
                            onError={(e) => {
                              e.target.src =
                                "https://via.placeholder.com/150?text=User";
                            }}
                          />
                        ) : (
                          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                            {leave.user?.name?.charAt(0) || "U"}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                          <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                            {leave.user?.name || "Unknown User"}
                            {isOwnRequest(leave) && user?.role === "admin" && (
                              <span className="ml-2 text-xs text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded">
                                Your Request
                              </span>
                            )}
                          </h3>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 sm:mt-0 ${getStatusColor(
                              leave.status
                            )}`}
                          >
                            {getStatusIcon(leave.status)}
                            <span className="ml-1 capitalize">
                              {leave.status}
                            </span>
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1 truncate">
                          {leave.user?.department || "Unknown Dept"}
                          {leave.user?.position && ` • ${leave.user.position}`}
                        </div>
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
                    <div className="flex items-center space-x-2 sm:space-x-4">
                      {!isMobile && (
                        <div className="text-right hidden sm:block">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {leave.leaveType}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(leave.startDate)} -{" "}
                            {formatDate(leave.endDate)}
                          </p>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => toggleExpand(leave.id)}
                        className="ml-1 flex-shrink-0 p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200 group-hover:bg-gray-100"
                      >
                        {expandedRequest === leave.id ? (
                          <ChevronUpIcon className="h-5 w-5" />
                        ) : (
                          <ChevronDownIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {isMobile && (
                    <div className="mt-2 flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        {leave.leaveType}
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {leave.days} day{leave.days !== 1 ? "s" : ""}
                      </div>
                    </div>
                  )}

                  {expandedRequest === leave.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                        <div className="lg:col-span-2 space-y-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                              Reason
                            </h4>
                            <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">
                              {leave.reason}
                            </p>
                          </div>

                          {leave.attachments?.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">
                                Supporting Documents
                              </h4>
                              <div className="border border-gray-200 rounded-lg overflow-hidden">
                                {leave.attachments.map((doc) => (
                                  <div
                                    key={doc.id}
                                    className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0"
                                  >
                                    <div className="flex-1 min-w-0 flex items-center space-x-2 sm:space-x-3">
                                      <DocumentTextIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                      <div className="min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate max-w-[180px] sm:max-w-[240px]">
                                          {doc.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {(doc.size / 1024).toFixed(1)} KB
                                        </p>
                                      </div>
                                    </div>

                                    <div className="ml-2 flex-shrink-0">
                                      <button
                                        type="button"
                                        className="inline-flex items-center px-2.5 py-1 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                                        onClick={() =>
                                          window.open(doc.url, "_blank")
                                        }
                                      >
                                        View
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-4">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                              Request Details
                            </h4>
                            <div className="space-y-3 text-sm">
                              <div>
                                <p className="text-gray-500">Submitted:</p>
                                <p className="font-medium text-gray-900">
                                  {formatDateTime(leave.submittedAt)}
                                </p>
                              </div>

                              {leave.status !== "pending" && (
                                <div>
                                  <p className="text-gray-500">
                                    {leave.status === "approved"
                                      ? "Approved"
                                      : "Rejected"}
                                    :
                                  </p>
                                  <p className="font-medium text-gray-900">
                                    {formatDateTime(leave.submittedAt)}
                                  </p>
                                </div>
                              )}

                              {leave.rejectionReason && (
                                <div>
                                  <p className="text-gray-500">
                                    Rejection Reason:
                                  </p>
                                  <p className="font-medium text-red-600 bg-red-50 p-2 rounded mt-1 text-sm">
                                    {leave.rejectionReason}
                                  </p>
                                </div>
                              )}

                              <div>
                                <p className="text-gray-500">Dates:</p>
                                <p className="font-medium text-gray-900">
                                  {formatDate(leave.startDate)} -{" "}
                                  {formatDate(leave.endDate)} ({leave.days} day
                                  {leave.days !== 1 ? "s" : ""})
                                </p>
                              </div>

                              {leave.emergencyContact && (
                                <div>
                                  <p className="text-gray-500">
                                    Emergency Contact:
                                  </p>
                                  <p className="font-medium text-gray-900">
                                    {leave.emergencyContact}
                                  </p>
                                </div>
                              )}

                              {leave.emergencyPhone && (
                                <div>
                                  <p className="text-gray-500">
                                    Emergency Phone:
                                  </p>
                                  <p className="font-medium text-gray-900">
                                    {leave.emergencyPhone}
                                  </p>
                                </div>
                              )}
                            </div>

                            {renderActionedByInfo(leave)}
                          </div>

                          {leave.status === "pending" &&
                            !isOwnRequest(leave) && (
                              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-xs">
                                <h4 className="text-sm font-medium text-gray-700 mb-3">
                                  Actions
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                  <button
                                    type="button"
                                    onClick={() => handleApprove(leave.id)}
                                    className="col-span-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
                                  >
                                    <CheckCircleIcon className="h-4 w-4 mr-1 sm:mr-2" />
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleReject(leave.id)}
                                    className="col-span-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
                                  >
                                    <XMarkIcon className="h-4 w-4 mr-1 sm:mr-2" />
                                    Reject
                                  </button>
                                </div>
                              </div>
                            )}

                          {leave.status === "pending" &&
                            isOwnRequest(leave) && (
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <p className="text-sm text-gray-600 text-center">
                                  You cannot approve or reject your own request.
                                </p>
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
