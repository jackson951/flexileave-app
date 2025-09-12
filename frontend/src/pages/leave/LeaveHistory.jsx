// src/pages/leave/LeaveHistory.jsx
import React, { useState } from "react";

import {
  ClockIcon, // ✅ same name
  CheckCircleIcon, // ✅ same name
  XMarkIcon, // ⚠️ replaces XIcon
  ChevronDownIcon, // ✅ same name
  ChevronUpIcon, // ✅ same name
  DocumentTextIcon, // ✅ same name
  CalendarDaysIcon, // ⚠️ replaces CalendarIcon
} from "@heroicons/react/24/outline";

const LeaveHistory = () => {
  const [expandedRequest, setExpandedRequest] = useState(null);
  const [filter, setFilter] = useState("all");

  // Dummy data for leave history
  const leaveHistory = [
    {
      id: 1,
      leaveType: "Annual Leave",
      startDate: "2023-06-15",
      endDate: "2023-06-20",
      days: 5,
      status: "approved",
      reason: "Family vacation to the coast",
      supportingDocs: [
        {
          id: "doc1",
          name: "travel_itinerary.pdf",
          size: "2.5 MB",
          type: "pdf",
        },
      ],
      submittedAt: "2023-05-25T10:30:00Z",
      processedAt: "2023-05-26T14:15:00Z",
      processedBy: "Admin User",
    },
    {
      id: 2,
      leaveType: "Sick Leave",
      startDate: "2023-05-10",
      endDate: "2023-05-11",
      days: 1,
      status: "approved",
      reason: "Doctor's appointment",
      supportingDocs: [
        {
          id: "doc2",
          name: "doctor_note.pdf",
          size: "1.2 MB",
          type: "pdf",
        },
      ],
      submittedAt: "2023-05-08T14:15:00Z",
      processedAt: "2023-05-09T09:30:00Z",
      processedBy: "Admin User",
    },
    {
      id: 3,
      leaveType: "Family Responsibility",
      startDate: "2023-04-25",
      endDate: "2023-04-26",
      days: 1,
      status: "approved",
      reason: "Child's school event",
      supportingDocs: [],
      submittedAt: "2023-04-20T09:45:00Z",
      processedAt: "2023-04-21T11:20:00Z",
      processedBy: "Admin User",
    },
    {
      id: 4,
      leaveType: "Unpaid Leave",
      startDate: "2023-07-01",
      endDate: "2023-07-14",
      days: 10,
      status: "pending",
      reason: "Personal development training",
      supportingDocs: [
        {
          id: "doc3",
          name: "course_registration.pdf",
          size: "3.1 MB",
          type: "pdf",
        },
      ],
      submittedAt: "2023-05-20T11:20:00Z",
    },
    {
      id: 5,
      leaveType: "Annual Leave",
      startDate: "2023-03-05",
      endDate: "2023-03-10",
      days: 5,
      status: "rejected",
      reason: "Weekend getaway",
      supportingDocs: [],
      submittedAt: "2023-02-25T15:10:00Z",
      processedAt: "2023-02-27T10:45:00Z",
      processedBy: "Admin User",
      rejectionReason:
        "Too many team members already on leave during this period",
    },
  ];

  const filteredRequests =
    filter === "all"
      ? leaveHistory
      : leaveHistory.filter(
          (req) => req.leaveType === filter || req.status === filter
        );

  const toggleExpand = (id) => {
    if (expandedRequest === id) {
      setExpandedRequest(null);
    } else {
      setExpandedRequest(id);
    }
  };

  const cancelLeave = (id) => {
    console.log("Cancel leave request:", id);
    // In a real app, you would call an API here
    alert(`Leave request ${id} cancelled successfully!`);
  };

  const editLeave = (id) => {
    console.log("Edit leave request:", id);
    // In a real app, you would navigate to edit page
    alert(`Editing leave request ${id}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Leave History</h1>
        <p className="mt-1 text-sm text-gray-500">
          View all your past and current leave requests
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              filter === "all"
                ? "bg-indigo-100 text-indigo-800"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilter("Annual Leave")}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              filter === "Annual Leave"
                ? "bg-indigo-100 text-indigo-800"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Annual
          </button>
          <button
            type="button"
            onClick={() => setFilter("Sick Leave")}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              filter === "Sick Leave"
                ? "bg-indigo-100 text-indigo-800"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Sick
          </button>
          <button
            type="button"
            onClick={() => setFilter("Family Responsibility")}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              filter === "Family Responsibility"
                ? "bg-indigo-100 text-indigo-800"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Family
          </button>
          <button
            type="button"
            onClick={() => setFilter("Unpaid Leave")}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              filter === "Unpaid Leave"
                ? "bg-indigo-100 text-indigo-800"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Unpaid
          </button>
          <button
            type="button"
            onClick={() => setFilter("pending")}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              filter === "pending"
                ? "bg-indigo-100 text-indigo-800"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Pending
          </button>
          <button
            type="button"
            onClick={() => setFilter("approved")}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              filter === "approved"
                ? "bg-indigo-100 text-indigo-800"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Approved
          </button>
          <button
            type="button"
            onClick={() => setFilter("rejected")}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              filter === "rejected"
                ? "bg-indigo-100 text-indigo-800"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Rejected
          </button>
        </div>
        <div className="text-sm text-gray-500">
          {filteredRequests.length} request
          {filteredRequests.length !== 1 ? "s" : ""} found
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <ul className="divide-y divide-gray-200">
          {filteredRequests.map((request) => (
            <li key={request.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className={`flex-shrink-0 rounded-full p-1 ${
                        request.status === "approved"
                          ? "bg-green-100"
                          : request.status === "rejected"
                          ? "bg-red-100"
                          : "bg-yellow-100"
                      }`}
                    >
                      {request.status === "approved" ? (
                        <CheckCircleIcon
                          className="h-5 w-5 text-green-600"
                          aria-hidden="true"
                        />
                      ) : request.status === "rejected" ? (
                        <XMarkIcon
                          className="h-5 w-5 text-red-600"
                          aria-hidden="true"
                        />
                      ) : (
                        <ClockIcon
                          className="h-5 w-5 text-yellow-600"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {request.leaveType} - {request.days} day
                        {request.days !== 1 ? "s" : ""}
                      </div>
                      <div className="text-xs text-gray-500">
                        {request.startDate} to {request.endDate}
                      </div>
                    </div>
                  </div>
                  <div className="ml-2 flex-shrink-0 flex">
                    <div className="text-right mr-4">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          request.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : request.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {request.status.charAt(0).toUpperCase() +
                          request.status.slice(1)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleExpand(request.id)}
                      className="ml-2 flex-shrink-0 text-gray-400 hover:text-gray-500"
                    >
                      {expandedRequest === request.id ? (
                        <ChevronUpIcon className="h-5 w-5" />
                      ) : (
                        <ChevronDownIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {expandedRequest === request.id && (
                  <div className="mt-4">
                    <div className="text-sm text-gray-700 mb-4">
                      <p className="font-medium">Reason:</p>
                      <p className="mt-1">{request.reason}</p>
                    </div>

                    {request.supportingDocs.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700">
                          Supporting Documents:
                        </p>
                        <ul className="mt-1 border border-gray-200 rounded-md divide-y divide-gray-200">
                          {request.supportingDocs.map((doc) => (
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
                                  {doc.size}
                                </span>
                              </div>
                              <div className="ml-4 flex-shrink-0">
                                <button
                                  type="button"
                                  className="font-medium text-indigo-600 hover:text-indigo-500"
                                  onClick={() =>
                                    alert(`Downloading ${doc.name}`)
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
                      <p>
                        Submitted:{" "}
                        {new Date(request.submittedAt).toLocaleString()}
                      </p>
                      {request.processedAt && (
                        <p>
                          Processed:{" "}
                          {new Date(request.processedAt).toLocaleString()} by{" "}
                          {request.processedBy}
                        </p>
                      )}
                      {request.rejectionReason && (
                        <p className="text-red-500 mt-1">
                          <span className="font-medium">Rejection Reason:</span>{" "}
                          {request.rejectionReason}
                        </p>
                      )}
                    </div>

                    <div className="flex space-x-3">
                      {request.status === "pending" && (
                        <>
                          <button
                            type="button"
                            onClick={() => cancelLeave(request.id)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <XMarkIcon
                              className="-ml-0.5 mr-2 h-4 w-4"
                              aria-hidden="true"
                            />
                            Cancel Request
                          </button>
                          <button
                            type="button"
                            onClick={() => editLeave(request.id)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            <CalendarDaysIcon
                              className="-ml-0.5 mr-2 h-4 w-4"
                              aria-hidden="true"
                            />
                            Edit Request
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default LeaveHistory;
