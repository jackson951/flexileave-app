// src/components/LeaveRequestSteps/ReviewStep.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useLeaveRequest } from "../../contexts/LeaveRequestContext";
import { ApiService } from "../../api/web-api-service";
import {
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  HomeIcon,
} from "@heroicons/react/24/outline";

const ReviewStep = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    formData,
    startDate,
    endDate,
    admins,
    isSubmitting,
    setIsSubmitting,
    submitError,
    setSubmitError,
    setIsSubmitted,
    setStep,
  } = useLeaveRequest();

  const leaveTypeMapping = {
    "Annual Leave": "AnnualLeave",
    "Sick Leave": "SickLeave",
    "Family Responsibility": "FamilyResponsibility",
    "Unpaid Leave": "UnpaidLeave",
    Other: "Other",
  };

  const getLeaveBalance = (leaveTypeDisplayName) => {
    if (!user?.leaveBalances) return 0;
    const backendType = leaveTypeMapping[leaveTypeDisplayName];
    return user.leaveBalances[backendType] || 0;
  };

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const diffTime = Math.abs(end - start);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const hasSufficientLeaveBalance = (leaveType, requestedDays) => {
    if (!leaveType || leaveType === "Unpaid Leave") return true;
    const availableBalance = getLeaveBalance(leaveType);
    return requestedDays <= availableBalance;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const createAdminNotifications = async (leaveId, leaveData) => {
    try {
      const notificationPromises = admins.map((admin) =>
        ApiService.post("/notifications", {
          userId: admin.id,
          type: "leave_submitted",
          title: "New Leave Request Submitted",
          message: `${user.name} has submitted a new ${
            formData.leaveType
          } request for ${calculateDays()} day${
            calculateDays() !== 1 ? "s" : ""
          } (${formatDate(startDate)} - ${formatDate(endDate)})`,
          leaveId,
        })
      );
      await Promise.all(notificationPromises);
    } catch (error) {
      console.error("Error creating admin notifications:", error);
    }
  };

  const handleSubmit = async () => {
    const requestedDays = calculateDays();
    if (
      formData.leaveType !== "Unpaid Leave" &&
      !hasSufficientLeaveBalance(formData.leaveType, requestedDays)
    ) {
      setSubmitError(
        `Insufficient leave balance: You only have ${getLeaveBalance(
          formData.leaveType
        )} ${formData.leaveType} days remaining`
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    try {
      const leaveData = {
        leaveType: leaveTypeMapping[formData.leaveType],
        reason: formData.reason,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        days: requestedDays,
        emergencyContact: formData.emergencyContact || null,
        emergencyPhone: formData.emergencyPhone || null,
        fileIds: formData.supportingDocs.map((doc) => doc.id),
      };

      const response = await ApiService.post("/leaves", leaveData);
      const createdLeave = response.data;

      if (admins.length > 0) {
        await createAdminNotifications(createdLeave.id, leaveData);
      }

      setIsSubmitted(true);
    } catch (err) {
      console.log("Error submitting leave request:", err);

      const backendErrors = err.response?.data?.errors;
      if (backendErrors && Array.isArray(backendErrors)) {
        setSubmitError(backendErrors.map((e) => e.msg).join(", "));
      } else {
        setSubmitError(
          err.response?.data?.message ||
            "Failed to submit leave request. Please try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Leave Request Summary
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Please review your leave request details carefully before
            submitting.
          </p>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Leave Type</dt>
              <dd className="mt-1 text-sm text-gray-900 font-medium">
                {formData.leaveType}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">
                Available Balance
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {getLeaveBalance(formData.leaveType)} day
                {getLeaveBalance(formData.leaveType) !== 1 ? "s" : ""}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Start Date</dt>
              <dd className="mt-1 text-sm text-gray-900 font-medium">
                {formatDate(startDate)}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">End Date</dt>
              <dd className="mt-1 text-sm text-gray-900 font-medium">
                {formatDate(endDate)}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Total Days</dt>
              <dd className="mt-1 text-sm text-gray-900 font-bold">
                {calculateDays()} day{calculateDays() !== 1 ? "s" : ""}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Reason</dt>
              <dd className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md border">
                {formData.reason}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">
                Emergency Contact
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formData.emergencyContact || "Not provided"}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">
                Emergency Phone
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formData.emergencyPhone || "Not provided"}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">
                Supporting Documents
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formData.supportingDocs.length > 0 ? (
                  <ul className="border border-gray-200 rounded-md divide-y divide-gray-200 bg-gray-50">
                    {formData.supportingDocs.map((file) => (
                      <li
                        key={file.id}
                        className="pl-3 pr-3 py-3 flex items-center text-sm"
                      >
                        <DocumentTextIcon className="flex-shrink-0 h-5 w-5 text-gray-400 mr-3" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    No documents attached
                  </p>
                )}
              </dd>
            </div>
          </dl>

          <div
            className={`mt-6 p-4 rounded-md ${
              formData.leaveType === "Unpaid Leave"
                ? "bg-blue-50 border border-blue-200"
                : hasSufficientLeaveBalance(formData.leaveType, calculateDays())
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <div className="flex items-start">
              {formData.leaveType === "Unpaid Leave" ? (
                <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
              ) : hasSufficientLeaveBalance(
                  formData.leaveType,
                  calculateDays()
                ) ? (
                <CheckCircleIcon className="h-5 w-5 text-green-400 mt-0.5 mr-2 flex-shrink-0" />
              ) : (
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" />
              )}
              <div>
                <h3 className="text-sm font-medium">
                  {formData.leaveType === "Unpaid Leave"
                    ? "Unpaid Leave Request"
                    : hasSufficientLeaveBalance(
                        formData.leaveType,
                        calculateDays()
                      )
                    ? "Leave Balance OK"
                    : "Insufficient Leave Balance"}
                </h3>
                <p
                  className={`mt-1 text-sm ${
                    formData.leaveType === "Unpaid Leave"
                      ? "text-blue-700"
                      : hasSufficientLeaveBalance(
                          formData.leaveType,
                          calculateDays()
                        )
                      ? "text-green-700"
                      : "text-red-700"
                  }`}
                >
                  {formData.leaveType === "Unpaid Leave"
                    ? "This is an unpaid leave request. No leave balance will be deducted."
                    : hasSufficientLeaveBalance(
                        formData.leaveType,
                        calculateDays()
                      )
                    ? `You have sufficient ${
                        formData.leaveType
                      } balance for this request. ${
                        getLeaveBalance(formData.leaveType) - calculateDays()
                      } days will remain after approval.`
                    : `You are requesting ${calculateDays()} days but only have ${getLeaveBalance(
                        formData.leaveType
                      )} days remaining. Please adjust your request.`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {submitError && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Submission Failed
              </h3>
              <p className="mt-2 text-sm text-red-700">{submitError}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-6">
        <button
          type="button"
          onClick={() => setStep(2)}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <svg
            className="-ml-1 mr-2 h-5 w-5 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={
            isSubmitting ||
            (formData.leaveType !== "Unpaid Leave" &&
              !hasSufficientLeaveBalance(formData.leaveType, calculateDays()))
          }
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:opacity-75"
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Submitting...
            </>
          ) : (
            "Submit Request"
          )}
        </button>
      </div>
    </div>
  );
};

export default ReviewStep;
