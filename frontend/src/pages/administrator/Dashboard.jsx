import React, { useState, useEffect } from "react";
import {
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  UserGroupIcon,
  ChartBarIcon,
  EyeIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  ChevronUpDownIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortConfig, setSortConfig] = useState({
    key: "startDate",
    direction: "asc",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Simulate loading and real-time clock
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    const clockTimer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      clearTimeout(timer);
      clearInterval(clockTimer);
    };
  }, []);

  // Enhanced dummy data with trends and proper avatar URLs
  const stats = {
    pendingRequests: { value: 12, trend: 5, isUp: false },
    employees: { value: 45, trend: 3, isUp: true },
    leaveThisMonth: { value: 23, trend: 8, isUp: true },
    leaveToday: { value: 5, trend: 2, isUp: false },
  };

  const recentActivity = [
    {
      id: 1,
      action: "Leave request approved",
      user: "John Doe",
      time: "2 minutes ago",
      type: "approval",
    },
    {
      id: 2,
      action: "New leave request submitted",
      user: "Sarah Wilson",
      time: "15 minutes ago",
      type: "request",
    },
    {
      id: 3,
      action: "Employee profile updated",
      user: "Mike Johnson",
      time: "1 hour ago",
      type: "update",
    },
  ];

  const pendingRequests = [
    {
      id: 1,
      employee: "John Doe",
      type: "Annual Leave",
      startDate: "2023-06-15",
      endDate: "2023-06-20",
      days: 5,
      reason: "Family vacation",
      priority: "normal",
      status: "pending",
      avatar:
        "https://ui-avatars.com/api/?name=John+Doe&background=6366f1&color=fff",
    },
    {
      id: 2,
      employee: "Jane Smith",
      type: "Sick Leave",
      startDate: "2023-06-10",
      endDate: "2023-06-11",
      days: 1,
      reason: "Doctor's appointment",
      priority: "urgent",
      status: "pending",
      avatar:
        "https://ui-avatars.com/api/?name=Jane+Smith&background=ef4444&color=fff",
    },
    {
      id: 3,
      employee: "Robert Johnson",
      type: "Family Responsibility",
      startDate: "2023-06-25",
      endDate: "2023-06-26",
      days: 1,
      reason: "Child's school event",
      priority: "normal",
      status: "pending",
      avatar:
        "https://ui-avatars.com/api/?name=Robert+Johnson&background=10b981&color=fff",
    },
    {
      id: 4,
      employee: "Emily Davis",
      type: "Unpaid Leave",
      startDate: "2023-07-01",
      endDate: "2023-07-05",
      days: 4,
      reason: "Personal matters",
      priority: "normal",
      status: "pending",
      avatar:
        "https://ui-avatars.com/api/?name=Emily+Davis&background=f59e0b&color=fff",
    },
    {
      id: 5,
      employee: "David Brown",
      type: "Bereavement Leave",
      startDate: "2023-06-28",
      endDate: "2023-07-02",
      days: 4,
      reason: "Loss of family member",
      priority: "urgent",
      status: "pending",
      avatar:
        "https://ui-avatars.com/api/?name=David+Brown&background=8b5cf6&color=fff",
    },
  ];

  const upcomingEvents = [
    { id: 1, title: "Team Meeting", time: "2:00 PM", attendees: 8 },
    { id: 2, title: "John's Leave Starts", time: "Tomorrow", attendees: 1 },
    { id: 3, title: "Quarterly Review", time: "Friday", attendees: 12 },
    { id: 4, title: "Company Retreat", time: "Next Week", attendees: 45 },
  ];

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  // Filter and sort logic
  const filteredAndSortedRequests = pendingRequests
    .filter((request) => {
      const matchesSearch =
        request.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.reason.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        selectedStatus === "all" || request.status === selectedStatus;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });

  const StatCard = ({
    title,
    value,
    trend,
    isUp,
    icon: Icon,
    color,
    bgColor,
  }) => (
    <div className="bg-white overflow-hidden shadow-lg rounded-xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`flex-shrink-0 ${bgColor} rounded-xl p-3`}>
              <Icon className={`h-6 w-6 ${color}`} />
            </div>
            <div className="ml-4">
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="flex items-center space-x-2">
                <div className="text-2xl font-bold text-gray-900">{value}</div>
                <div
                  className={`flex items-center text-xs ${
                    isUp ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {isUp ? (
                    <ArrowTrendingUpIcon className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-3 w-3 mr-1" />
                  )}
                  {trend}%
                </div>
              </dd>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const handleApprove = (id) => {
    console.log(`Approving request ${id}`);
  };

  const handleReject = (id) => {
    console.log(`Rejecting request ${id}`);
  };

  const handleViewDetails = (id) => {
    console.log(`Viewing details for request ${id}`);
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column)
      return <ChevronUpDownIcon className="h-4 w-4" />;
    return sortConfig.direction === "asc" ? (
      <ChevronUpIcon className="h-4 w-4" />
    ) : (
      <ChevronDownIcon className="h-4 w-4" />
    );
  };

  const PriorityBadge = ({ priority }) => {
    const colors = {
      urgent: "bg-red-100 text-red-800",
      normal: "bg-yellow-100 text-yellow-800",
    };
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[priority]}`}
      >
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
        {priority === "urgent" && (
          <ExclamationTriangleIcon className="h-3 w-3 ml-1" />
        )}
      </span>
    );
  };

  const StatusBadge = ({ status }) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status]}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header with real-time info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, Admin
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {currentTime.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}{" "}
            •{" "}
            {currentTime.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </p>
        </div>
        <button className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Refresh Data
        </button>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Pending Requests"
          value={stats.pendingRequests.value}
          trend={stats.pendingRequests.trend}
          isUp={stats.pendingRequests.isUp}
          icon={ClockIcon}
          color="text-amber-600"
          bgColor="bg-amber-100"
        />
        <StatCard
          title="Total Employees"
          value={stats.employees.value}
          trend={stats.employees.trend}
          isUp={stats.employees.isUp}
          icon={UserGroupIcon}
          color="text-indigo-600"
          bgColor="bg-indigo-100"
        />
        <StatCard
          title="Leave This Month"
          value={stats.leaveThisMonth.value}
          trend={stats.leaveThisMonth.trend}
          isUp={stats.leaveThisMonth.isUp}
          icon={CalendarDaysIcon}
          color="text-green-600"
          bgColor="bg-green-100"
        />
        <StatCard
          title="Leave Today"
          value={stats.leaveToday.value}
          trend={stats.leaveToday.trend}
          isUp={stats.leaveToday.isUp}
          icon={DocumentTextIcon}
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pending Requests - Takes 2 columns */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow-lg rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Pending Leave Requests
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Manage and review all pending leave applications
                  </p>
                </div>

                <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      placeholder="Search requests..."
                    />
                  </div>

                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <FunnelIcon className="h-4 w-4 mr-2" />
                    Filters
                  </button>
                </div>
              </div>

              {/* Filters Panel */}
              {showFilters && (
                <div className="mt-4 p-4 bg-gray-50 rounded-md">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority
                      </label>
                      <select className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                        <option value="all">All Priorities</option>
                        <option value="urgent">Urgent</option>
                        <option value="normal">Normal</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date Range
                      </label>
                      <select className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                        <option value="all">All Dates</option>
                        <option value="this-week">This Week</option>
                        <option value="this-month">This Month</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Employee
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("type")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Type</span>
                        <SortIcon column="type" />
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("startDate")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Date</span>
                        <SortIcon column="startDate" />
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Duration
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Priority
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedRequests.map((request) => (
                    <tr
                      key={request.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img
                              className="h-10 w-10 rounded-full"
                              src={request.avatar}
                              alt={request.employee}
                              onError={(e) => {
                                e.target.src =
                                  "https://ui-avatars.com/api/?name=" +
                                  encodeURIComponent(request.employee) +
                                  "&background=6366f1&color=fff";
                              }}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {request.employee}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {request.type}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {request.reason.length > 25
                            ? `${request.reason.substring(0, 25)}...`
                            : request.reason}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          {new Date(request.startDate).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          to {new Date(request.endDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.days} day{request.days !== 1 ? "s" : ""}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <PriorityBadge priority={request.priority} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={request.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleViewDetails(request.id)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="View Details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleApprove(request.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Approve"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleReject(request.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Reject"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredAndSortedRequests.length === 0 && (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        <div className="flex flex-col items-center">
                          <ChartBarIcon className="h-12 w-12 mb-4 text-gray-300" />
                          <p className="text-lg font-medium">
                            No pending requests found
                          </p>
                          <p className="mt-1">
                            Try adjusting your search or filter criteria.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Recent Activity & Upcoming */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <div className="bg-white shadow-lg rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  Recent Activity
                </h3>
                <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                  View All
                </button>
              </div>
            </div>
            <div className="px-6 py-4 space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div
                    className={`mt-1 h-2 w-2 rounded-full ${
                      activity.type === "approval"
                        ? "bg-green-500"
                        : activity.type === "request"
                        ? "bg-blue-500"
                        : "bg-gray-500"
                    }`}
                  ></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-500">by {activity.user}</p>
                    <p className="text-xs text-gray-400">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white shadow-lg rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  Upcoming Events
                </h3>
                <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                  View All
                </button>
              </div>
            </div>
            <div className="px-6 py-4 space-y-4">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {event.title}
                    </p>
                    <p className="text-xs text-gray-500">{event.time}</p>
                  </div>
                  <div className="text-xs text-gray-400">
                    {event.attendees} attendees
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl overflow-hidden shadow-lg">
            <div className="px-6 py-5">
              <h3 className="text-lg font-semibold text-white mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50 transition-colors">
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add New Employee
                </button>
                <button className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
                  <PencilIcon className="h-5 w-5 mr-2" />
                  Configure Leave Policies
                </button>
                <button className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  Generate Monthly Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
