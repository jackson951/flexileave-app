import React, { useState, useEffect } from "react";
import {
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  BellIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartPieIcon,
  ChartBarIcon,
  UsersIcon,
  FunnelIcon,
  ArrowPathIcon,
  EyeIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { format, subDays, subMonths, subQuarters, subYears } from "date-fns";
import { toast } from "react-toastify";

import { analyticsService } from "../../services/analyticsService";
import { useAuth } from "../../contexts/AuthContext";

const AnalyticsDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for analytics data
  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [notifications, setNotifications] = useState(null);

  // Filters and settings
  const [period, setPeriod] = useState("month");
  const [interval, setInterval] = useState("week");
  const [tenantColors, setTenantColors] = useState({
    primaryColor: "#4f46e5",
    secondaryColor: "#7c3aed",
  });

  // Load data
  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [overviewData, trendsData, userStatsData, notificationsData] = 
        await Promise.all([
          analyticsService.getLeaveOverview(period),
          analyticsService.getLeaveTrends(period, interval),
          analyticsService.getUserStats(),
          analyticsService.getNotifications(),
        ]);

      setOverview(overviewData);
      setTrends(trendsData);
      setUserStats(userStatsData);
      setNotifications(notificationsData);
      
      // Set tenant colors from any response
      if (overviewData?.tenantColors) {
        setTenantColors(overviewData.tenantColors);
      }
    } catch (err) {
      console.error("Error loading analytics data:", err);
      setError("Failed to load analytics data. Please try again.");
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [period, interval]);

  // Format numbers with commas
  const formatNumber = (num) => num.toLocaleString();

  // Get date range label
  const getDateRangeLabel = () => {
    const now = new Date();
    let startDate;
    
    switch (period) {
      case "week":
        startDate = subDays(now, 7);
        return `Last 7 days (${format(startDate, "MMM d")} - ${format(now, "MMM d")})`;
      case "quarter":
        startDate = subQuarters(now, 1);
        return `Last quarter (${format(startDate, "MMM d, yyyy")} - ${format(now, "MMM d, yyyy")})`;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        return `Year ${now.getFullYear()}`;
      case "month":
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        return `${format(startDate, "MMMM yyyy")}`;
    }
  };

  if (loading && !overview) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          {/* Header skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </div>
          
          {/* Charts skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
              <div className="mt-2">
                <button
                  onClick={loadData}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Insights and statistics for {user?.tenantName || "your organization"}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{getDateRangeLabel()}</p>
          </div>
          
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
            {/* Period Filter */}
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="week">Last 7 days</option>
              <option value="month">This month</option>
              <option value="quarter">Last quarter</option>
              <option value="year">This year</option>
            </select>

            {/* Interval Filter */}
            <select
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
            </select>

            {/* Refresh Button */}
            <button
              onClick={loadData}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Leaves */}
        <SummaryCard
          title="Total Leave Requests"
          value={overview?.totalLeaves || 0}
          icon={CalendarDaysIcon}
          color={tenantColors.primaryColor}
          trend={calculateTrend(overview?.totalLeaves, 10)}
        />
        
        {/* Pending Approvals */}
        <SummaryCard
          title="Pending Approvals"
          value={userStats?.pendingApprovals || 0}
          icon={ClockIcon}
          color="#f59e0b"
          trend={calculateTrend(userStats?.pendingApprovals, 5)}
        />
        
        {/* Approved Leaves */}
        <SummaryCard
          title="Approved Leaves"
          value={overview?.approvedCount || 0}
          icon={CheckCircleIcon}
          color="#10b981"
          trend={calculateTrend(overview?.approvedCount, 8)}
        />
        
        {/* Unread Notifications */}
        <SummaryCard
          title="Unread Notifications"
          value={notifications?.unreadCount || 0}
          icon={BellIcon}
          color="#ef4444"
          trend={calculateTrend(notifications?.unreadCount, 2)}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leave Status Pie Chart */}
        <ChartCard title="Leave Status Distribution" icon={ChartPieIcon}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={overview?.statusDistribution || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {overview?.statusDistribution?.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={getStatusColor(entry.status, tenantColors)} 
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value} requests`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Leave Type Bar Chart */}
        <ChartCard title="Leave Types Distribution" icon={ChartBarIcon}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overview?.leaveTypeDistribution || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="leaveType" />
                <YAxis />
                <Tooltip formatter={(value) => `${value} requests`} />
                <Bar 
                  dataKey="count" 
                  fill={tenantColors.primaryColor}
                  radius={[4, 4, 0, 0]}
                >
                  <LabelList dataKey="count" position="top" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Leave Trends Line Chart */}
        <ChartCard title="Leave Trends Over Time" icon={ChartBarIcon} className="lg:col-span-2">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends?.trends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => format(new Date(date), "MMM d")}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => format(new Date(date), "MMM d, yyyy")}
                  formatter={(value, name) => [`${value} requests`, name]}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="totalRequests" 
                  stroke={tenantColors.primaryColor} 
                  strokeWidth={2}
                  dot={{ fill: tenantColors.primaryColor }}
                />
                <Line 
                  type="monotone" 
                  dataKey="approvedRequests" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: "#10b981" }}
                />
                <Line 
                  type="monotone" 
                  dataKey="pendingRequests" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  dot={{ fill: "#f59e0b" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Subordinate Stats */}
        {userStats?.subordinateStats && userStats.subordinateStats.length > 0 && (
          <ChartCard title="Team Leave Statistics" icon={UsersIcon}>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {userStats.subordinateStats.map((subordinate) => (
                <div key={subordinate.userId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {subordinate.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{subordinate.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-300">{subordinate.email}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{subordinate.totalLeaves} total</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {subordinate.approvedLeaves} approved • {subordinate.pendingLeaves} pending
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        )}

        {/* Department Stats */}
        {userStats?.departmentStats && userStats.departmentStats.length > 0 && (
          <ChartCard title="Department Leave Analysis" icon={UserGroupIcon}>
            <div className="space-y-4">
              {userStats.departmentStats.slice(0, 5).map((dept, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{dept.department}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-300">{dept.employeeCount} employees</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{dept.totalLeaves} leaves</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Avg: {dept.avgLeavesPerEmployee} per employee
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        )}
      </div>

      {/* Recent Notifications */}
      {notifications?.recentNotifications && notifications.recentNotifications.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Notifications</h3>
            <button className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium">
              View All
            </button>
          </div>
          <div className="space-y-3">
            {notifications.recentNotifications.slice(0, 5).map((notification) => (
              <div key={notification.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${notification.isRead ? 'bg-gray-300 dark:bg-gray-600' : 'bg-indigo-500'}`}></div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{notification.title}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-300">{notification.message}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {format(new Date(notification.createdAt), "MMM d, h:mm a")}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper components
const SummaryCard = ({ title, value, icon: Icon, color, trend }) => (
  <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-lg rounded-xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0" style={{ backgroundColor: color }}>
            <Icon className="h-6 w-6 text-white p-1.5 rounded-xl" />
          </div>
          <div className="ml-4">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</dt>
            <dd className="text-2xl font-bold text-gray-900 dark:text-white">{value.toLocaleString()}</dd>
          </div>
        </div>
        <div className={`flex items-center text-sm ${trend.isUp ? 'text-green-600' : 'text-red-600'}`}>
          {trend.isUp 
            ? <ArrowTrendingUpIcon className="h-4 w-4 mr-1" /> 
            : <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
          }
          {Math.abs(trend.value)}%
        </div>
      </div>
    </div>
  </div>
);

const ChartCard = ({ title, icon: Icon, children, className = "" }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 ${className}`}>
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
        <Icon className="h-5 w-5 mr-2 text-indigo-600" />
        {title}
      </h3>
      <div className="flex space-x-2">
        <button className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">
          <EyeIcon className="h-4 w-4" />
        </button>
        <button className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">
          <ArrowDownTrayIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
    {children}
  </div>
);

// Helper function to calculate trends (mock data for now)
const calculateTrend = (current, previous) => {
  const change = current - previous;
  const percentage = previous > 0 ? Math.abs((change / previous) * 100) : 0;
  
  return {
    value: Math.round(percentage),
    isUp: change >= 0
  };
};

// Helper function to get status colors
const getStatusColor = (status, tenantColors) => {
  const colors = {
    PENDING: tenantColors.secondaryColor || "#f59e0b",
    APPROVED: "#10b981",
    REJECTED: "#ef4444",
    CANCELLED: "#6b7280"
  };
  return colors[status] || tenantColors.primaryColor;
};

export default AnalyticsDashboard;