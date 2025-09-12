// src/pages/admin/LeaveApprovals.jsx
import React, { useState } from "react";
import {
  CheckCircleIcon,

  ChevronDownIcon,
  ChevronUpIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { XMarkIcon } from "@heroicons/react/24/outline";

const LeaveApprovals = () => {
  const [expandedRequest, setExpandedRequest] = useState(null);
  const [filter, setFilter] = useState("all");

  // Dummy data for pending leave requests
  const pendingRequests = [
    {
      id: 1,
      employee: {
        name: "John Doe",
        avatar: "https://randomuser.me/api/portraits/men/1.jpg",
        department: "Engineering",
        position: "Senior Developer",
      },
      leaveType: "Annual Leave",
      startDate: "2023-06-15",
      endDate: "2023-06-20",
      days: 5,
      reason:
        "Family vacation. We're planning a trip to the coast for some relaxation and family time.",
      supportingDocs: [
        {
          id: "doc1",
          name: "travel_itinerary.pdf",
          size: "2.5 MB",
          type: "pdf",
        },
      ],
      submittedAt: "2023-05-25T10:30:00Z",
    },
    {
      id: 2,
      employee: {
        name: "Jane Smith",
        avatar: "https://randomuser.me/api/portraits/women/1.jpg",
        department: "Marketing",
        position: "Marketing Manager",
      },
      leaveType: "Sick Leave",
      startDate: "2023-06-10",
      endDate: "2023-06-11",
      days: 1,
      reason:
        "Doctor's appointment for a follow-up on my recent medical procedure.",
      supportingDocs: [
        {
          id: "doc2",
          name: "doctor_note.pdf",
          size: "1.2 MB",
          type: "pdf",
        },
      ],
      submittedAt: "2023-05-24T14:15:00Z",
    },
    {
      id: 3,
      employee: {
        name: "Robert Johnson",
        avatar: "https://randomuser.me/api/portraits/men/2.jpg",
        department: "Sales",
        position: "Sales Executive",
      },
      leaveType: "Family Responsibility",
      startDate: "2023-06-25",
      endDate: "2023-06-26",
      days: 1,
      reason:
        "Attending my child's graduation ceremony at their school. This is an important family event.",
      supportingDocs: [],
      submittedAt: "2023-05-26T09:45:00Z",
    },
    {
      id: 4,
      employee: {
        name: "Sarah Williams",
        avatar: "https://randomuser.me/api/portraits/women/2.jpg",
        department: "HR",
        position: "HR Specialist",
      },
      leaveType: "Unpaid Leave",
      startDate: "2023-07-01",
      endDate: "2023-07-14",
      days: 10,
      reason:
        "Personal development break to attend a professional training course.",
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
  ];

  const filteredRequests =
    filter === "all"
      ? pendingRequests
      : pendingRequests.filter((req) => req.leaveType === filter);

  const toggleExpand = (id) => {
    if (expandedRequest === id) {
      setExpandedRequest(null);
    } else {
      setExpandedRequest(id);
    }
  };

  const handleApprove = (id) => {
    console.log("Approved leave request:", id);
    // In a real app, you would call an API here
    alert(`Leave request ${id} approved successfully!`);
  };

  const handleReject = (id) => {
    console.log("Rejected leave request:", id);
    // In a real app, you would call an API here
    const reason = prompt("Please enter the reason for rejection:");
    if (reason) {
      alert(`Leave request ${id} rejected. Reason: ${reason}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Leave Approvals</h1>
        <p className="mt-1 text-sm text-gray-500">
          Review and approve or reject pending leave requests
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
                  <div className="flex items-center min-w-0">
                    <div className="flex-shrink-0">
                      <img
                        className="h-10 w-10 rounded-full"
                        src={request.employee.avatar}
                        alt={request.employee.name}
                      />
                    </div>
                    <div className="ml-4 min-w-0">
                      <div className="text-sm font-medium text-indigo-600 truncate">
                        {request.employee.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {request.employee.department} •{" "}
                        {request.employee.position}
                      </div>
                    </div>
                  </div>
                  <div className="ml-2 flex-shrink-0 flex">
                    <div className="text-right mr-4">
                      <p className="text-sm font-medium text-gray-900">
                        {request.leaveType}
                      </p>
                      <p className="text-xs text-gray-500">
                        {request.startDate} to {request.endDate} ({request.days}{" "}
                        day
                        {request.days !== 1 ? "s" : ""})
                      </p>
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
                      Submitted:{" "}
                      {new Date(request.submittedAt).toLocaleString()}
                    </div>

                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={() => handleApprove(request.id)}
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
                        onClick={() => handleReject(request.id)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <XMarkIcon
                          className="-ml-0.5 mr-2 h-4 w-4"
                          aria-hidden="true"
                        />
                        Reject
                      </button>
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

export default LeaveApprovals;
