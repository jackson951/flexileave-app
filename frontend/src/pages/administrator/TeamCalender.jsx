import React, { useState, useEffect } from "react";
import {
  CalendarIcon,
  UserGroupIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  UsersIcon,
  ShieldCheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../contexts/AuthContext";
import { format, subDays, parseISO } from "date-fns";
import { ApiService, useApiInterceptors } from "../../api/web-api-service";

const TeamCalendar = () => {
  const { user } = useAuth();
  const [currentDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize API interceptors
  useApiInterceptors();

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

  // Fetch leave data from API
  useEffect(() => {
    const fetchLeaves = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await ApiService.get("/leaves");

        const mappedLeaves = response.data
          .filter((leave) =>
            ["approved", "pending"].includes(leave.status?.toLowerCase())
          )
          .map((leave) => ({
            id: leave.id,
            leaveType: leave.leaveType,
            startDate: leave.startDate,
            endDate: leave.endDate,
            days: leave.days,
            reason: leave.reason || "",
            status: leave.status.toLowerCase(),
            submittedAt: leave.submittedAt,
            user: leave.user || {
              name: "Unknown",
              department: "Unknown",
              avatar: leave.user?.avatar || null,
            },
          }));

        setLeaves(mappedLeaves);
      } catch (err) {
        console.error("Error fetching leaves:", err);
        setError(err.response?.data?.message || "Failed to fetch leave data");
      } finally {
        setLoading(false);
      }
    };

    fetchLeaves();
  }, []);

  // Helper functions
  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  // Fixed date formatting - ensures consistent date string format
  const formatDateString = (date) => {
    if (!date) return "";
    const d = new Date(date);
    // Ensure we're working with the local date, not UTC
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Fixed date parsing to avoid timezone issues
  const parseDate = (dateString) => {
    if (!dateString) return null;
    // Handle both ISO strings and date objects
    if (dateString instanceof Date) return dateString;

    // If it's already in YYYY-MM-DD format, parse it as local date
    if (typeof dateString === "string") {
      if (dateString.includes("T")) {
        // ISO string with time
        return new Date(dateString);
      } else {
        // YYYY-MM-DD format - parse as local date to avoid timezone shift
        const [year, month, day] = dateString.split("-").map(Number);
        return new Date(year, month - 1, day);
      }
    }

    return new Date(dateString);
  };

  // Fixed date comparison function
  const isDateInRange = (targetDate, startDate, endDate) => {
    const target = parseDate(targetDate);
    const start = parseDate(startDate);
    const end = parseDate(endDate);

    if (!target || !start || !end) return false;

    // Compare dates only (ignore time)
    const targetDateOnly = new Date(
      target.getFullYear(),
      target.getMonth(),
      target.getDate()
    );
    const startDateOnly = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate()
    );
    const endDateOnly = new Date(
      end.getFullYear(),
      end.getMonth(),
      end.getDate()
    );

    return targetDateOnly >= startDateOnly && targetDateOnly <= endDateOnly;
  };

  const filterLeaves = () => {
    return leaves.filter((leave) => {
      const matchesDept =
        departmentFilter === "all" ||
        leave.user.department?.toLowerCase() === departmentFilter.toLowerCase();
      return matchesDept;
    });
  };

  // Generate calendar data with fixed date handling
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
      const currentDate = new Date(selectedYear, selectedMonth, day);
      const currentDateString = formatDateString(currentDate);

      const dayLeaves = filteredLeaves.filter((req) => {
        return isDateInRange(currentDate, req.startDate, req.endDate);
      });

      days.push({
        date: currentDateString,
        day,
        leaves: dayLeaves,
        dateObj: currentDate,
      });
    }

    return days;
  };

  const calendarDays = generateCalendarData();
  const pendingRequests = leaves.filter((leave) => leave.status === "pending");

  // Get department capacity warnings
  const getDepartmentCapacity = () => {
    const today = new Date();
    const todayString = formatDateString(today);
    const todayData = calendarDays.find((day) => day.date === todayString);

    if (!todayData) return null;

    const deptCounts = {};
    todayData.leaves.forEach((leave) => {
      const dept = leave.user.department || "Unknown";
      deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    });

    return Object.entries(deptCounts)
      .filter(([_, count]) => count >= 3)
      .map(([dept, count]) => `${count} people from ${dept}`);
  };

  // Color mapping for leave types
  const getLeaveColor = (type, status) => {
    if (status === "pending") return "bg-yellow-500";

    const colors = {
      "Annual Leave": "bg-blue-500",
      "Sick Leave": "bg-red-500",
      "Maternity/Paternity": "bg-pink-500",
      "Emergency Leave": "bg-orange-500",
      "Unpaid Leave": "bg-gray-600",
      "Bereavement Leave": "bg-purple-500",
    };

    return colors[type] || "bg-gray-500";
  };

  // Navigation handlers
  const prevMonth = () => {
    setSelectedMonth((prev) => {
      if (prev === 0) {
        setSelectedYear((year) => year - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const nextMonth = () => {
    setSelectedMonth((prev) => {
      if (prev === 11) {
        setSelectedYear((year) => year + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  // Handle day click safely
  const handleDayClick = (date) => {
    if (!date) return;
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  // Fixed function to get requests for selected date
  const getDateRequests = () => {
    if (!selectedDate) return [];

    console.log("Selected date:", selectedDate); // Debug log

    const filteredLeaves = filterLeaves();
    const matchingLeaves = filteredLeaves.filter((leave) => {
      const isInRange = isDateInRange(
        selectedDate,
        leave.startDate,
        leave.endDate
      );

      // Debug logs
      console.log(`Checking leave for ${leave.user.name}:`, {
        selectedDate,
        startDate: leave.startDate,
        endDate: leave.endDate,
        isInRange,
      });

      return isInRange;
    });

    console.log("Matching leaves:", matchingLeaves); // Debug log
    return matchingLeaves;
  };

  // Format date display safely
  const formatDateDisplay = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = parseDate(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "Invalid Date";
    }
  };

  // Format time display safely
  const formatTimeDisplay = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = parseDate(dateString);
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid Time";
    }
  };

  // Status icon
  const getStatusIcon = (status) => {
    return status === "pending" ? (
      <ClockIcon className="h-4 w-4 text-yellow-600" />
    ) : (
      <CheckCircleIcon className="h-4 w-4 text-green-600" />
    );
  };

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

  const capacityWarnings = getDepartmentCapacity();

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
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
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
          Instantly see who is out and who is requesting time off — plan
          coverage with confidence.
        </p>
      </div>

      {/* Pending Requests Banner */}
      {pendingRequests.length > 0 && (
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg shadow-sm">
          <div className="flex items-start">
            <ClockIcon className="h-5 w-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                ⏳ Pending Leave Requests ({pendingRequests.length})
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                These requests need review. Click "View Details" to approve or
                reject.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {pendingRequests.slice(0, 3).map((request) => (
                  <span
                    key={request.id}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                  >
                    {request.user.name.split(" ")[0]} — {request.leaveType}
                  </span>
                ))}
                {pendingRequests.length > 3 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    +{pendingRequests.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Capacity Warning */}
      {capacityWarnings && capacityWarnings.length > 0 && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg shadow-sm">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-red-800">
                ⚠️ High Absence Alert
              </h3>
              <p className="text-sm text-red-700 mt-1">
                {capacityWarnings.join(", ")} are out today. Consider
                redistributing work.
              </p>
            </div>
          </div>
        </div>
      )}

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
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <h2 className="text-2xl font-semibold text-gray-900 min-w-[200px] text-center">
              {monthNames[selectedMonth]} {selectedYear}
            </h2>
            <button
              onClick={nextMonth}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Next month"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
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
      </div>

      {/* Calendar Grid */}
      <div className="bg-white shadow rounded-xl overflow-hidden">
        {/* Weekdays Header */}
        <div className="grid grid-cols-7 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="py-3 px-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 divide-y divide-gray-200">
          {calendarDays.map((day, index) => {
            const isToday = day.date === formatDateString(new Date());
            return (
              <div
                key={index}
                className={`min-h-32 p-2 border-r border-b border-gray-200 ${
                  day.date
                    ? "cursor-pointer hover:bg-gray-50"
                    : "bg-gray-50 cursor-default"
                } ${
                  isToday
                    ? "bg-blue-50 border-blue-200 ring-2 ring-blue-200"
                    : ""
                }`}
                onClick={() => day.date && handleDayClick(day.date)}
              >
                {day.date && (
                  <>
                    <div
                      className={`text-sm font-medium mb-1 ${
                        isToday ? "text-blue-700 font-bold" : "text-gray-900"
                      }`}
                    >
                      {day.day}
                    </div>

                    <div className="space-y-1">
                      {day.leaves.slice(0, 3).map((leave, idx) => (
                        <div
                          key={`${leave.id}-${idx}`}
                          className={`text-xs text-white px-2 py-1 rounded truncate leading-tight ${getLeaveColor(
                            leave.leaveType,
                            leave.status
                          )}`}
                          title={`${leave.user.name} - ${leave.leaveType}${
                            leave.status === "pending" ? " (Pending)" : ""
                          }`}
                        >
                          {leave.user?.name.split(" ")[0]}
                          {leave.status === "pending" && " ⏳"}
                        </div>
                      ))}

                      {day.leaves.length > 3 && (
                        <div className="text-xs text-gray-500 px-2 py-1 bg-gray-200 rounded">
                          +{day.leaves.length - 3} more
                        </div>
                      )}

                      {day.leaves.filter((l) => l.status === "approved")
                        .length > 0 && (
                        <div className="text-xs text-gray-600 font-medium mt-1">
                          {
                            day.leaves.filter((l) => l.status === "approved")
                              .length
                          }{" "}
                          out
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-8 bg-white shadow rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Legend</h3>
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
            <span className="text-sm text-gray-700">Family Leave</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
            <span className="text-sm text-gray-700">Pending Request</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-gray-600 mr-2"></div>
            <span className="text-sm text-gray-700">Other Leave</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
            <span className="text-sm text-gray-700">Bereavement</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
            <span className="text-sm text-gray-700">Emergency</span>
          </div>
        </div>
      </div>

      {/* Day Detail Modal */}
      {isModalOpen && selectedDate && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {parseDate(selectedDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Approved absences and pending requests
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
                      All team members are available today.
                    </p>
                    <p className="text-gray-400 mt-1">
                      No leave requests for this day.
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
                          {request.user.avatar ? (
                            <img
                              src={request.user.avatar}
                              alt={request.user.name}
                              className="h-12 w-12 rounded-full mr-4"
                              onError={(e) => {
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  request.user.name || "Unknown"
                                )}&background=6366f1&color=FFFFFF`;
                              }}
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center mr-4">
                              <span className="text-indigo-600 font-medium">
                                {request.user.name
                                  ?.split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <h4 className="font-medium text-gray-900 text-lg">
                              {request.user.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {request.user.department} • {request.leaveType}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {formatDateDisplay(request.startDate)} —{" "}
                              {formatDateDisplay(request.endDate)} (
                              {request.days} day{request.days !== 1 ? "s" : ""})
                            </p>
                          </div>
                        </div>

                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            request.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {getStatusIcon(request.status)}
                          <span className="ml-1 capitalize">
                            {request.status}
                          </span>
                        </span>
                      </div>

                      {request.reason && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <p className="text-sm text-gray-700">
                            <strong>Reason:</strong> {request.reason}
                          </p>
                        </div>
                      )}

                      <div className="mt-4 text-xs text-gray-500">
                        Submitted: {formatTimeDisplay(request.submittedAt)}
                      </div>
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
