import React, { useState, useEffect } from "react";
import {
  CalendarIcon,
  UserGroupIcon,
  FunnelIcon,
  ChevronUpDownIcon,
  CheckCircleIcon,
  XMarkIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../contexts/AuthContext";
import { format, subDays, parseISO } from "date-fns";

const TeamCalender = () => {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState("pdf"); // pdf, csv

  // Departments list — derived from unique values in leaves
  const departments = [
    "All",
    "Engineering",
    "Marketing",
    "Sales",
    "HR",
    "Finance",
    "Operations",
    "IT",
    "Customer Support",
  ];

  // Status filters
  const statuses = ["All", "Approved", "Pending", "Rejected"];

  // Fetch leave data from API
  useEffect(() => {
    const fetchLeaves = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("authToken");
        if (!token) throw new Error("Authentication token not found");

        const response = await fetch("http://localhost:5000/api/leaves", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch leave data");
        }

        const data = await response.json();

        // Map backend data to frontend structure
        const mappedLeaves = data.map((leave) => ({
          id: leave.id,
          leaveType: leave.leaveType,
          startDate: leave.startDate,
          endDate: leave.endDate,
          days: leave.days,
          reason: leave.reason || "",
          status: leave.status.toLowerCase(), // normalize to lowercase: "pending", "approved", "rejected"
          submittedAt: leave.submittedAt,
          user: leave.user || { name: "Unknown", department: "Unknown" }, // fallback if user is missing
        }));

        setLeaves(mappedLeaves);
      } catch (err) {
        console.error("Error fetching leaves:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaves();
  }, []);

  // Get days in selected month
  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  // Format date as YYYY-MM-DD
  const formatDate = (date) => {
    return date.toISOString().split("T")[0];
  };

  // Filter leaves based on selected department and status
  const filterLeaves = () => {
    return leaves.filter((leave) => {
      // Department filter
      const matchesDept =
        departmentFilter === "all" ||
        leave.user.department?.toLowerCase() === departmentFilter.toLowerCase();

      // Status filter
      const matchesStatus =
        statusFilter === "all" || leave.status === statusFilter.toLowerCase();

      return matchesDept && matchesStatus;
    });
  };

  // Generate calendar days array with associated leave events
  const generateCalendarData = () => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    const firstDay = getFirstDayOfMonth(selectedMonth, selectedYear);

    const days = [];
    const filteredLeaves = filterLeaves();

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      days.push({ date: null, day: null, leaves: [] });
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = formatDate(
        new Date(selectedYear, selectedMonth, day)
      );

      const dayLeaves = filteredLeaves.filter((req) => {
        const start = new Date(req.startDate);
        const end = new Date(req.endDate);
        const current = new Date(currentDate);

        // Include if current day falls between start and end (inclusive)
        return current >= start && current <= end;
      });

      days.push({
        date: currentDate,
        day: day,
        leaves: dayLeaves,
      });
    }

    return days;
  };

  const calendarDays = generateCalendarData();

  // Group leaves by department for capacity warning
  const getDeptCapacityWarning = (dayIndex) => {
    const day = calendarDays[dayIndex];
    if (!day || !day.date) return null;

    const deptCounts = {};
    day.leaves.forEach((leave) => {
      const dept = leave.user.department || "Unknown";
      deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    });

    for (const dept in deptCounts) {
      if (deptCounts[dept] >= 3) {
        return `${deptCounts[dept]} people from ${dept} are off today`;
      }
    }
    return null;
  };

  // Color mapping for leave types and status
  const getLeaveColor = (type, status) => {
    const baseColors = {
      "Annual Leave": "bg-blue-500",
      "Sick Leave": "bg-red-500",
      "Maternity/Paternity": "bg-pink-500",
      "Emergency Leave": "bg-orange-500",
      "Unpaid Leave": "bg-gray-500",
      "Bereavement Leave": "bg-purple-500",
    };

    const statusColors = {
      approved: "opacity-90",
      pending: "bg-yellow-500 opacity-80",
      rejected: "bg-gray-400 opacity-60",
    };

    const typeColor = baseColors[type] || "bg-gray-500";
    const statusColor = statusColors[status] || "";

    return `${typeColor} ${statusColor}`;
  };

  // Month name helper
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Navigation handlers
  const prevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const nextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  // Legend items
  const legendItems = [
    { label: "Annual Leave", color: "bg-blue-500" },
    { label: "Sick Leave", color: "bg-red-500" },
    { label: "Unpaid Leave", color: "bg-gray-500" },
    { label: "Pending", color: "bg-yellow-500" },
    { label: "Rejected", color: "bg-gray-400" },
  ];

  // Handle day click to open modal
  const handleDayClick = (date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  // Export to PDF (placeholder)
  const exportToPDF = () => {
    alert("PDF export feature will be implemented in the next release.");
  };

  // Export to CSV (placeholder)
  const exportToCSV = () => {
    alert("CSV export feature will be implemented in the next release.");
  };

  // Format date for display
  const formatDateDisplay = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Format datetime for display
  const formatDateTimeDisplay = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
      case "pending":
        return <ClockIcon className="h-4 w-4 text-yellow-600" />;
      case "rejected":
        return <XMarkIcon className="h-4 w-4 text-red-600" />;
      default:
        return <ClockIcon className="h-4 w-4 text-yellow-600" />;
    }
  };

  // Get all leave requests for selected date
  const getDateRequests = () => {
    if (!selectedDate) return [];
    return leaves.filter((req) => {
      const start = new Date(req.startDate);
      const end = new Date(req.endDate);
      const current = new Date(selectedDate);
      return current >= start && current <= end;
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-xl"></div>
          ))}
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
              <XMarkIcon className="h-5 w-5 text-red-400" />
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Team Calendar</h1>
        <p className="mt-2 text-gray-600">
          Monitor team availability and plan coverage across departments. View
          approved, pending, and rejected leave requests.
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white shadow rounded-xl p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          {/* Month Navigation */}
          <div className="flex items-center space-x-4">
            <button
              onClick={prevMonth}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Previous month"
            >
              <ChevronUpDownIcon className="h-5 w-5 rotate-180" />
            </button>
            <h2 className="text-2xl font-semibold text-gray-900">
              {monthNames[selectedMonth]} {selectedYear}
            </h2>
            <button
              onClick={nextMonth}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Next month"
            >
              <ChevronUpDownIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="relative">
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept.toLowerCase()}>
                    {dept}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserGroupIcon className="h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {statuses.map((status) => (
                  <option key={status} value={status.toLowerCase()}>
                    {status}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FunnelIcon className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Export Button */}
          <div className="flex items-center">
            <button
              onClick={() => setShowExportModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export Calendar
            </button>
          </div>
        </div>

        {/* Capacity Warning Banner */}
        {calendarDays.some((day) => day.leaves.length > 0) && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
              <p className="text-sm text-yellow-800">
                <strong>Team Capacity Alert:</strong>{" "}
                {getDeptCapacityWarning(
                  calendarDays.findIndex((d) => d.day === new Date().getDate())
                ) || "No critical overloads detected."}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Calendar Grid */}
      <div className="bg-white shadow rounded-xl overflow-hidden">
        <div className="grid grid-cols-7 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="py-3 px-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 divide-y divide-gray-200">
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={`min-h-32 p-1 cursor-pointer transition-colors ${
                day.date ? "hover:bg-gray-50" : "bg-gray-50 cursor-default"
              }`}
              onClick={() => day.date && handleDayClick(day.date)}
            >
              {day.date && (
                <>
                  {/* Day number */}
                  <div className="text-xs font-medium text-gray-900 mb-1">
                    {day.day}
                  </div>

                  {/* Leave Events */}
                  <div className="space-y-1">
                    {day.leaves.slice(0, 3).map((leave, idx) => (
                      <div
                        key={`${leave.id}-${idx}`}
                        className={`text-[10px] text-white px-1 py-0.5 rounded truncate leading-tight ${getLeaveColor(
                          leave.leaveType,
                          leave.status
                        )}`}
                        title={`${leave.user.name} - ${leave.leaveType}\n${leave.reason}`}
                      >
                        {leave.user?.name.split(" ")[0]}
                        {leave.status === "pending" && " ⏳"}
                        {leave.status === "rejected" && " ❌"}
                      </div>
                    ))}

                    {/* More indicator */}
                    {day.leaves.length > 3 && (
                      <div className="text-[10px] text-gray-500 px-1 py-0.5 rounded bg-gray-200">
                        +{day.leaves.length - 3}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-8 bg-white shadow rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Legend</h3>
        <div className="flex flex-wrap gap-4">
          {legendItems.map((item, idx) => (
            <div key={idx} className="flex items-center">
              <div className={`w-3 h-3 rounded-full ${item.color} mr-2`}></div>
              <span className="text-sm text-gray-700">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Day Detail Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Leave Requests for{" "}
                  <span className="text-indigo-600">
                    {new Date(selectedDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Close modal"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {getDateRequests().length === 0 ? (
                  <div className="text-center py-12">
                    <ClockIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">
                      No leave requests scheduled for this day.
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      All team members are available.
                    </p>
                  </div>
                ) : (
                  getDateRequests().map((request) => (
                    <div
                      key={request.id}
                      className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center mb-4 md:mb-0">
                          <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                              request.user.name
                            )}&background=6366f1&color=FFFFFF`}
                            alt={request.user.name}
                            className="h-12 w-12 rounded-full object-cover mr-4"
                            onError={(e) => {
                              e.target.src =
                                "  https://ui-avatars.com/api/?name=Unknown&background=6366f1&color=FFFFFF";
                            }}
                          />
                          <div>
                            <h4 className="font-medium text-gray-900 text-lg">
                              {request.user.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {request.user.department || "Unknown"} •{" "}
                              {request.leaveType}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end space-y-1">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                request.status
                              )}`}
                            >
                              {getStatusIcon(request.status)}
                              <span className="ml-1 capitalize">
                                {request.status}
                              </span>
                            </span>
                            <span className="text-xs text-gray-500">
                              Submitted:{" "}
                              {formatDateTimeDisplay(request.submittedAt)}
                            </span>
                          </div>

                          <div className="text-sm text-gray-700">
                            {formatDateDisplay(request.startDate)} to{" "}
                            {formatDateDisplay(request.endDate)} (
                            {Math.ceil(
                              (new Date(request.endDate) -
                                new Date(request.startDate)) /
                                (1000 * 60 * 60 * 24)
                            )}{" "}
                            day
                            {Math.ceil(
                              (new Date(request.endDate) -
                                new Date(request.startDate)) /
                                (1000 * 60 * 60 * 24)
                            ) !== 1
                              ? "s"
                              : ""}
                            )
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <p className="text-sm text-gray-700">
                          <strong>Reason:</strong>{" "}
                          {request.reason || "No reason provided"}
                        </p>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-500 italic">
                          This is a read-only view. To approve or reject, go to{" "}
                          <a
                            href="/dashboard/leave"
                            className="text-indigo-600 hover:text-indigo-500 underline"
                          >
                            Leave Approvals
                          </a>
                          .
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="inline-flex items-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Export Calendar
                </h3>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <p className="text-gray-600 mb-6">
                Export the current calendar view for reporting or archival
                purposes.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => {
                    setShowExportModal(false);
                    exportToPDF();
                  }}
                  className="p-4 border border-gray-300 rounded-lg text-center hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <div className="flex flex-col items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-red-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    <span className="mt-2 text-sm font-medium text-gray-700">
                      PDF
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowExportModal(false);
                    exportToCSV();
                  }}
                  className="p-4 border border-gray-300 rounded-lg text-center hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <div className="flex flex-col items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-green-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    <span className="mt-2 text-sm font-medium text-gray-700">
                      CSV
                    </span>
                  </div>
                </button>
              </div>

              <div className="text-sm text-gray-500 mb-6">
                <p>
                  • Data includes: Employee, Department, Type, Dates, Status
                </p>
                <p>
                  • Exported files contain filtered results based on your
                  current view.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamCalender;
