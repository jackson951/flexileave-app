import React from "react";
import {
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

const Dashboard = () => {
  // Dummy stats
  const leaveStats = {
    total: 21,
    used: 15,
    remaining: 6,
    pending: 2,
    approved: 5,
    rejected: 1,
  };

  const recentRequests = [
    {
      id: 1,
      type: "Annual Leave",
      startDate: "2023-06-15",
      endDate: "2023-06-20",
      status: "approved",
      days: 5,
    },
    {
      id: 2,
      type: "Sick Leave",
      startDate: "2023-06-10",
      endDate: "2023-06-11",
      status: "pending",
      days: 1,
    },
    {
      id: 3,
      type: "Family Responsibility",
      startDate: "2023-05-25",
      endDate: "2023-05-26",
      status: "approved",
      days: 1,
    },
    {
      id: 4,
      type: "Unpaid Leave",
      startDate: "2023-05-15",
      endDate: "2023-05-16",
      status: "rejected",
      days: 1,
      reason: "Not enough notice given",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your leave balances and recent requests
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Total leave */}
        <div className="bg-white shadow rounded-lg p-6 flex items-center">
          <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
            <CalendarDaysIcon className="h-6 w-6 text-white" />
          </div>
          <div className="ml-5">
            <p className="text-sm font-medium text-gray-500">
              Total Leave Days
            </p>
            <p className="text-2xl font-semibold text-gray-900">
              {leaveStats.total}
            </p>
          </div>
        </div>

        {/* Remaining leave */}
        <div className="bg-white shadow rounded-lg p-6 flex items-center">
          <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
            <CheckCircleIcon className="h-6 w-6 text-white" />
          </div>
          <div className="ml-5">
            <p className="text-sm font-medium text-gray-500">Remaining Leave</p>
            <p className="text-2xl font-semibold text-gray-900">
              {leaveStats.remaining}
            </p>
          </div>
        </div>

        {/* Pending requests */}
        <div className="bg-white shadow rounded-lg p-6 flex items-center">
          <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
            <ClockIcon className="h-6 w-6 text-white" />
          </div>
          <div className="ml-5">
            <p className="text-sm font-medium text-gray-500">
              Pending Requests
            </p>
            <p className="text-2xl font-semibold text-gray-900">
              {leaveStats.pending}
            </p>
          </div>
        </div>

        {/* Approved */}
        <div className="bg-white shadow rounded-lg p-6 flex items-center">
          <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
            <DocumentTextIcon className="h-6 w-6 text-white" />
          </div>
          <div className="ml-5">
            <p className="text-sm font-medium text-gray-500">
              Approved This Year
            </p>
            <p className="text-2xl font-semibold text-gray-900">
              {leaveStats.approved}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Requests */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">
            Recent Leave Requests
          </h2>
        </div>
        <div className="bg-white shadow rounded-lg">
          <ul className="divide-y divide-gray-200">
            {recentRequests.map((req) => (
              <li key={req.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className={`flex-shrink-0 rounded-full p-1 ${
                        req.status === "approved"
                          ? "bg-green-100"
                          : req.status === "rejected"
                          ? "bg-red-100"
                          : "bg-yellow-100"
                      }`}
                    >
                      {req.status === "approved" ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-600" />
                      ) : req.status === "rejected" ? (
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                      ) : (
                        <ClockIcon className="h-5 w-5 text-yellow-600" />
                      )}
                    </div>
                    <p className="ml-3 text-sm font-medium text-gray-900">
                      {req.type} – {req.days} day{req.days !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">
                    {req.startDate} to {req.endDate}
                  </p>
                </div>
                {req.reason && (
                  <p className="mt-2 text-sm text-gray-500">
                    Reason: {req.reason}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
