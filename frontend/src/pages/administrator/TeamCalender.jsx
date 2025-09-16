import React, { useState, useEffect } from "react";
import {
  UserGroupIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  XMarkIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  UsersIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../contexts/AuthContext";

const TeamCalendar = () => {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [viewMode, setViewMode] = useState("approved"); // "approved", "all"
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Departments list
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

  // View modes with clear purpose
  const viewModes = [
    {
      value: "approved",
      label: "Team Availability",
      icon: ShieldCheckIcon,
      color: "text-green-600",
      description: "Shows confirmed absences for planning",
    },
    {
      value: "all",
      label: "All Requests",
      icon: EyeIcon,
      color: "text-gray-600",
      description: "Shows all requests including pending",
    },
  ];

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
          status: leave.status.toLowerCase(),
          submittedAt: leave.submittedAt,
          user: leave.user || { name: "Unknown", department: "Unknown" },
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

  // Filter leaves based on view mode and department
  const filterLeaves = () => {
    return leaves.filter((leave) => {
      // Department filter
      const matchesDept =
        departmentFilter === "all" ||
        leave.user.department?.toLowerCase() === departmentFilter.toLowerCase();

      // View mode filter - this is the key change!
      const matchesView =
        viewMode === "all" ||
        (viewMode === "approved" && leave.status === "approved");

      return matchesDept && matchesView;
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

  // Get department capacity warnings
  const getDepartmentCapacity = () => {
    const today = new Date();
    const todayString = formatDate(today);
    const todayData = calendarDays.find((day) => day.date === todayString);

    if (!todayData) return null;

    const deptCounts = {};
    todayData.leaves.forEach((leave) => {
      const dept = leave.user.department || "Unknown";
      deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    });

    const warnings = [];
    Object.entries(deptCounts).forEach(([dept, count]) => {
      if (count >= 3) {
        warnings.push(`${count} people from ${dept}`);
      }
    });

    return warnings.length > 0 ? warnings : null;
  };

  // Color mapping for leave types - cleaner for approved-only view
  const getLeaveColor = (type, status) => {
    if (viewMode === "approved") {
      // Clean colors for approved leaves only
      const colors = {
        "Annual Leave": "bg-blue-500",
        "Sick Leave": "bg-red-500",
        "Maternity/Paternity": "bg-pink-500",
        "Emergency Leave": "bg-orange-500",
        "Unpaid Leave": "bg-gray-600",
        "Bereavement Leave": "bg-purple-500",
      };
      return colors[type] || "bg-gray-500";
    } else {
      // Status-aware colors for "all" view
      const baseColors = {
        "Annual Leave": "bg-blue-500",
        "Sick Leave": "bg-red-500",
        "Maternity/Paternity": "bg-pink-500",
        "Emergency Leave": "bg-orange-500",
        "Unpaid Leave": "bg-gray-600",
        "Bereavement Leave": "bg-purple-500",
      };

      const typeColor = baseColors[type] || "bg-gray-500";

      if (status === "pending") return "bg-yellow-500";
      if (status === "rejected") return "bg-gray-400 opacity-60";

      return typeColor;
    }
  };

  // Month names
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

  // Handle day click
  const handleDayClick = (date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  // Get requests for selected date
  const getDateRequests = () => {
    if (!selectedDate) return [];

    const allLeaves =
      viewMode === "approved"
        ? leaves.filter((l) => l.status === "approved")
        : leaves;

    return allLeaves.filter((req) => {
      // Apply department filter
      const matchesDept =
        departmentFilter === "all" ||
        req.user.department?.toLowerCase() === departmentFilter.toLowerCase();

      if (!matchesDept) return false;

      const start = new Date(req.startDate);
      const end = new Date(req.endDate);
      const current = new Date(selectedDate);
      return current >= start && current <= end;
    });
  };

  // Format date display
  const formatDateDisplay = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Get status styling
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-96 bg-gray-200 rounded-xl"></div>
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

  const capacityWarnings = getDepartmentCapacity();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Team Calendar</h1>
        <p className="mt-2 text-gray-600">
          {viewMode === "approved"
            ? "View confirmed team absences to plan workload and coverage effectively."
            : "View all leave requests including pending and rejected ones."}
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white shadow rounded-xl p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
          {/* Month Navigation */}
          <div className="flex items-center space-x-4">
            <button
              onClick={prevMonth}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <h2 className="text-2xl font-semibold text-gray-900 min-w-[200px] text-center">
              {monthNames[selectedMonth]} {selectedYear}
            </h2>
            <button
              onClick={nextMonth}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {viewModes.map((mode) => {
              const Icon = mode.icon;
              return (
                <button
                  key={mode.value}
                  onClick={() => setViewMode(mode.value)}
                  className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    viewMode === mode.value
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  title={mode.description}
                >
                  <Icon className={`h-4 w-4 mr-2 ${mode.color}`} />
                  {mode.label}
                </button>
              );
            })}
          </div>

          {/* Department Filter */}
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
        </div>

        {/* Capacity Warnings */}
        {capacityWarnings && (
          <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Team Capacity Alert
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  High absence rate today: {capacityWarnings.join(", ")} are
                  out.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Calendar Grid */}
      <div className="bg-white shadow rounded-xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-7 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="py-3 px-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={`min-h-32 p-2 border-r border-b border-gray-200 cursor-pointer transition-colors ${
                day.date ? "hover:bg-gray-50" : "bg-gray-50 cursor-default"
              } ${
                day.date === formatDate(new Date())
                  ? "bg-blue-50 border-blue-200"
                  : ""
              }`}
              onClick={() => day.date && handleDayClick(day.date)}
            >
              {day.date && (
                <>
                  {/* Day number */}
                  <div
                    className={`text-sm font-medium mb-2 ${
                      day.date === formatDate(new Date())
                        ? "text-blue-700"
                        : "text-gray-900"
                    }`}
                  >
                    {day.day}
                  </div>

                  {/* Leave indicators */}
                  <div className="space-y-1">
                    {day.leaves.slice(0, 3).map((leave, idx) => (
                      <div
                        key={`${leave.id}-${idx}`}
                        className={`text-xs text-white px-2 py-1 rounded truncate ${getLeaveColor(
                          leave.leaveType,
                          leave.status
                        )}`}
                        title={`${leave.user.name} - ${leave.leaveType}${
                          viewMode === "all" ? ` (${leave.status})` : ""
                        }`}
                      >
                        {leave.user?.name.split(" ")[0]}
                        {viewMode === "all" &&
                          leave.status === "pending" &&
                          " ⏳"}
                        {viewMode === "all" &&
                          leave.status === "rejected" &&
                          " ❌"}
                      </div>
                    ))}

                    {/* More indicator */}
                    {day.leaves.length > 3 && (
                      <div className="text-xs text-gray-500 px-2 py-1 bg-gray-200 rounded">
                        +{day.leaves.length - 3} more
                      </div>
                    )}

                    {/* Team availability indicator */}
                    {viewMode === "approved" && day.leaves.length > 0 && (
                      <div className="text-xs text-gray-600 font-medium mt-2">
                        {day.leaves.length} out
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {viewMode === "approved" ? "Leave Types" : "Legend"}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
            <span className="text-sm text-gray-700">Annual Leave</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
            <span className="text-sm text-gray-700">Sick Leave</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-pink-500 mr-2"></div>
            <span className="text-sm text-gray-700">Maternity/Paternity</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-gray-600 mr-2"></div>
            <span className="text-sm text-gray-700">Other Leave</span>
          </div>
          {viewMode === "all" && (
            <>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                <span className="text-sm text-gray-700">Pending ⏳</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-gray-400 mr-2"></div>
                <span className="text-sm text-gray-700">Rejected ❌</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Day Detail Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {new Date(selectedDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </h3>
                  <p className="text-gray-600 mt-1">
                    {viewMode === "approved"
                      ? "Team members out today"
                      : "All leave requests for this day"}
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {getDateRequests().length === 0 ? (
                  <div className="text-center py-12">
                    <UsersIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">
                      {viewMode === "approved"
                        ? "All team members are available today"
                        : "No leave requests for this day"}
                    </p>
                  </div>
                ) : (
                  getDateRequests().map((request) => (
                    <div
                      key={request.id}
                      className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center">
                          <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                              request.user.name
                            )}&background=6366f1&color=FFFFFF`}
                            alt={request.user.name}
                            className="h-12 w-12 rounded-full mr-4"
                          />
                          <div>
                            <h4 className="font-medium text-gray-900 text-lg">
                              {request.user.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {request.user.department} • {request.leaveType}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {formatDateDisplay(request.startDate)} -{" "}
                              {formatDateDisplay(request.endDate)}
                            </p>
                          </div>
                        </div>

                        {viewMode === "all" && (
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
                        )}
                      </div>

                      {request.reason && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <p className="text-sm text-gray-700">
                            <strong>Reason:</strong> {request.reason}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamCalendar;
