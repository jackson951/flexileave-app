// src/components/LeaveRequestSteps/DatesAndDocumentsStep.jsx
import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useLeaveRequest } from "../../contexts/LeaveRequestContext";
import { ApiService } from "../../api/web-api-service";
import {
  ArrowUpTrayIcon,
  DocumentTextIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

const DatesAndDocumentsStep = () => {
  const { user } = useAuth();
  const {
    formData,
    setFormData,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    errors,
    setErrors,
    fileUploading,
    setFileUploading,
    fileUploadError,
    setFileUploadError,
    fileDeleteError,
    setFileDeleteError,
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

  const getMinEndDate = () =>
    startDate || new Date().toISOString().split("T")[0];

  const validateStep2 = () => {
    const newErrors = {};
    const days = calculateDays();
    if (!startDate) {
      newErrors.dates = "Please select a start date";
    } else if (!endDate) {
      newErrors.dates = "Please select an end date";
    } else if (days < 1) {
      newErrors.dates = "End date must be after start date";
    } else if (days > 365) {
      newErrors.dates = "Leave period cannot exceed 365 days";
    }
    if (
      formData.leaveType !== "Unpaid Leave" &&
      !hasSufficientLeaveBalance(formData.leaveType, days)
    ) {
      const availableBalance = getLeaveBalance(formData.leaveType);
      newErrors.dates = `You only have ${availableBalance} ${formData.leaveType} days remaining, but you're requesting ${days} days`;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStartDateChange = (e) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);
    if (endDate && new Date(endDate) < new Date(newStartDate)) {
      setEndDate("");
    }
    if (errors.dates) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated.dates;
        return updated;
      });
    }
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
    if (errors.dates) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated.dates;
        return updated;
      });
    }
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    if (files.length + formData.supportingDocs.length > 5) {
      setFileUploadError("You can upload a maximum of 5 files");
      return;
    }
    setFileUploading(true);
    setFileUploadError("");
    try {
      const uploadFormData = new FormData();
      files.forEach((file) => uploadFormData.append("files", file));
      const response = await ApiService.post("/leaves/upload", uploadFormData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFormData((prev) => ({
        ...prev,
        supportingDocs: [...prev.supportingDocs, ...response.data],
      }));
    } catch (err) {
      setFileUploadError(
        err.response?.data?.message ||
          "Failed to upload files. Please check file size (max 10MB) and type (PDF, DOC, JPG, PNG)."
      );
    } finally {
      setFileUploading(false);
    }
  };

  const removeFile = async (fileId) => {
    try {
      await ApiService.delete(`/leaves/file/${fileId}`);
      setFormData((prev) => ({
        ...prev,
        supportingDocs: prev.supportingDocs.filter(
          (file) => file.id !== fileId
        ),
      }));
      setFileDeleteError("");
    } catch (err) {
      setFileDeleteError(
        err.response?.data?.message ||
          "Failed to delete file. It may be attached to another request."
      );
    }
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

  const handleNext = () => {
    if (validateStep2()) {
      setStep(3);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Select Leave Dates <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="startDate"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={handleStartDateChange}
              min={new Date().toISOString().split("T")[0]}
              className={`block w-full rounded-md border ${
                errors.dates ? "border-red-300" : "border-gray-300"
              } shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2`}
            />
          </div>
          <div>
            <label
              htmlFor="endDate"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={handleEndDateChange}
              min={getMinEndDate()}
              className={`block w-full rounded-md border ${
                errors.dates ? "border-red-300" : "border-gray-300"
              } shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2`}
            />
          </div>
        </div>

        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Start Date:</span>
              <p className="text-gray-900">
                {startDate ? formatDate(startDate) : "Not selected"}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700">End Date:</span>
              <p className="text-gray-900">
                {endDate ? formatDate(endDate) : "Not selected"}
              </p>
            </div>
            <div className="col-span-2">
              <span className="font-medium text-gray-700">Total Days:</span>
              <p className="text-lg font-bold text-indigo-600">
                {calculateDays()} day{calculateDays() !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {formData.leaveType && formData.leaveType !== "Unpaid Leave" && (
            <div
              className={`mt-3 p-3 rounded-md ${
                hasSufficientLeaveBalance(formData.leaveType, calculateDays())
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <div className="flex items-start">
                {hasSufficientLeaveBalance(
                  formData.leaveType,
                  calculateDays()
                ) ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-400 mt-0.5 mr-2 flex-shrink-0" />
                ) : (
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" />
                )}
                <p
                  className={`text-sm ${
                    hasSufficientLeaveBalance(
                      formData.leaveType,
                      calculateDays()
                    )
                      ? "text-green-700"
                      : "text-red-700"
                  }`}
                >
                  {hasSufficientLeaveBalance(
                    formData.leaveType,
                    calculateDays()
                  )
                    ? `You have sufficient ${
                        formData.leaveType
                      } balance (${getLeaveBalance(
                        formData.leaveType
                      )} days remaining)`
                    : `Insufficient ${
                        formData.leaveType
                      } balance: ${getLeaveBalance(
                        formData.leaveType
                      )} days remaining but requesting ${calculateDays()} days`}
                </p>
              </div>
            </div>
          )}
        </div>
        {errors.dates && (
          <p className="mt-2 text-sm text-red-600">{errors.dates}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Supporting Documents (Optional)
        </label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors duration-200">
          <div className="space-y-1 text-center">
            <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="flex text-sm text-gray-600 justify-center flex-wrap">
              <label
                htmlFor="file-upload"
                className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500"
              >
                <span>Upload files</span>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  className="sr-only"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  disabled={fileUploading}
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">
              PDF, DOC, JPG, PNG up to 10MB (max 5 files)
            </p>
            {fileUploading && (
              <div className="flex items-center justify-center">
                <svg
                  className="animate-spin h-4 w-4 mr-2 text-indigo-500"
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
                <p className="text-xs text-indigo-500">Uploading...</p>
              </div>
            )}
          </div>
        </div>

        {formData.supportingDocs.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Uploaded Documents ({formData.supportingDocs.length}/5)
            </h3>
            <ul className="border border-gray-200 rounded-md divide-y divide-gray-200 bg-gray-50">
              {formData.supportingDocs.map((file) => (
                <li
                  key={file.id}
                  className="pl-3 pr-3 py-3 flex items-center justify-between text-sm hover:bg-gray-100"
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <DocumentTextIcon className="flex-shrink-0 h-5 w-5 text-gray-400 mr-3" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(file.id)}
                    className="ml-2 flex-shrink-0 inline-flex items-center p-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700"
                    title="Remove this file"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-6">
        <button
          type="button"
          onClick={() => setStep(1)}
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
          onClick={handleNext}
          disabled={!startDate || !endDate || calculateDays() < 1}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <svg
            className="ml-2 -mr-1 h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default DatesAndDocumentsStep;
