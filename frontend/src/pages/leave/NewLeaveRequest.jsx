import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { DateRangePicker } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import {
  DocumentTextIcon,
  CalendarDaysIcon,
  ArrowUpTrayIcon,
  XMarkIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HomeIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { ApiService, useApiInterceptors } from "../../api/web-api-service";

const NewLeaveRequest = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    leaveType: "",
    reason: "",
    supportingDocs: [],
    emergencyContact: "",
    emergencyPhone: "",
  });
  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ]);
  const [errors, setErrors] = useState({});
  const [fileUploading, setFileUploading] = useState(false);
  const [fileUploadError, setFileUploadError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Initialize interceptors
  useApiInterceptors();

  // Map display names to backend values
  const leaveTypeMapping = {
    "Annual Leave": "AnnualLeave",
    "Sick Leave": "SickLeave",
    "Family Responsibility": "FamilyResponsibility",
    "Unpaid Leave": "UnpaidLeave",
    Other: "Other",
  };

  const leaveTypes = [
    "Annual Leave",
    "Sick Leave",
    "Family Responsibility",
    "Unpaid Leave",
    "Other",
  ];

  // Get leave balance for a specific leave type
  const getLeaveBalance = (leaveTypeDisplayName) => {
    if (!user?.leaveBalances) return 0;
    const backendType = leaveTypeMapping[leaveTypeDisplayName];
    return user.leaveBalances[backendType] || 0;
  };

  // Calculate total days in date range
  const calculateDays = () => {
    const diffTime = Math.abs(dateRange[0].endDate - dateRange[0].startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  // Validate if requested days exceed available balance
  const hasSufficientLeaveBalance = (leaveType, requestedDays) => {
    if (!leaveType) return true; // No type selected yet
    const availableBalance = getLeaveBalance(leaveType);
    return requestedDays <= availableBalance;
  };

  // Validate Step 1
  const validateStep1 = () => {
    const newErrors = {};
    const requestedDays = calculateDays();

    if (!formData.leaveType) {
      newErrors.leaveType = "Please select a leave type";
    } else {
      const availableBalance = getLeaveBalance(formData.leaveType);
      if (availableBalance <= 0 && formData.leaveType !== "Unpaid Leave") {
        newErrors.leaveType = `You have no ${formData.leaveType} days remaining`;
      }
    }

    if (!formData.reason) {
      newErrors.reason = "Please provide a reason";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate Step 2
  const validateStep2 = () => {
    const days = calculateDays();
    const hasValidDates = days >= 1;

    if (!hasValidDates) {
      setErrors({ dates: "Please select valid dates (at least 1 day)" });
      return false;
    }

    // Skip balance check for unpaid leave
    if (formData.leaveType !== "Unpaid Leave") {
      if (!hasSufficientLeaveBalance(formData.leaveType, days)) {
        const availableBalance = getLeaveBalance(formData.leaveType);
        setErrors({
          dates: `You only have ${availableBalance} ${formData.leaveType} days remaining, but you're requesting ${days} days`,
        });
        return false;
      }
    }

    setErrors({});
    return true;
  };

  // Handle date change
  const handleDateChange = (ranges) => {
    setDateRange([ranges.selection]);

    // Clear date-related errors when dates change
    if (errors.dates) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.dates;
        return newErrors;
      });
    }
  };

  // Handle file upload
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length + formData.supportingDocs.length > 5) {
      setFileUploadError("You can upload a maximum of 5 files");
      return;
    }

    setFileUploading(true);
    setFileUploadError("");

    try {
      const uploadFormData = new FormData();
      files.forEach((file) => {
        uploadFormData.append("files", file);
      });

      // Use ApiService for file upload
      const response = await ApiService.post("/leaves/upload", uploadFormData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setFormData((prev) => ({
        ...prev,
        supportingDocs: [...prev.supportingDocs, ...response.data],
      }));
    } catch (err) {
      console.error("Error uploading files:", err);
      setFileUploadError(
        err.response?.data?.message || "Failed to upload files"
      );
    } finally {
      setFileUploading(false);
    }
  };

  // Remove file
  const removeFile = async (fileId) => {
    try {
      // Use ApiService for file deletion
      await ApiService.delete(`/leaves/files/${fileId}`);

      setFormData((prev) => ({
        ...prev,
        supportingDocs: prev.supportingDocs.filter(
          (file) => file.id !== fileId
        ),
      }));
    } catch (err) {
      console.error("Error deleting file:", err);
      setFileUploadError(
        err.response?.data?.message || "Failed to delete file"
      );
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
      }
      return;
    }

    if (step === 2) {
      if (validateStep2()) {
        setStep(3);
      }
      return;
    }

    if (step === 3) {
      // Final validation before submission
      const requestedDays = calculateDays();
      if (
        formData.leaveType !== "Unpaid Leave" &&
        !hasSufficientLeaveBalance(formData.leaveType, requestedDays)
      ) {
        const availableBalance = getLeaveBalance(formData.leaveType);
        setSubmitError(
          `Insufficient leave balance: You only have ${availableBalance} ${formData.leaveType} days remaining`
        );
        return;
      }

      setIsSubmitting(true);
      setSubmitError("");

      try {
        const leaveData = {
          leaveType: leaveTypeMapping[formData.leaveType], // Convert to backend format
          reason: formData.reason,
          startDate: dateRange[0].startDate.toISOString(),
          endDate: dateRange[0].endDate.toISOString(),
          days: requestedDays,
          emergencyContact: formData.emergencyContact,
          emergencyPhone: formData.emergencyPhone,
          fileIds: formData.supportingDocs.map((doc) => doc.id),
        };

        // Use ApiService for leave submission
        await ApiService.post("/leaves", leaveData);

        setIsSubmitted(true);
      } catch (err) {
        console.error("Error submitting leave request:", err);
        setSubmitError(
          err.response?.data?.message || "Failed to submit leave request"
        );
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Step Indicator Component
  const StepIndicator = ({ number, currentStep, label }) => (
    <li className="flex items-center">
      <span
        className={`flex items-center justify-center w-8 h-8 rounded-full ${
          currentStep === number
            ? "bg-indigo-600 text-white"
            : currentStep > number
            ? "bg-green-100 text-green-800"
            : "bg-gray-200 text-gray-600"
        }`}
      >
        {currentStep > number ? (
          <CheckCircleIcon className="w-5 h-5" />
        ) : (
          number
        )}
      </span>
      <span
        className={`ml-3 text-sm font-medium ${
          currentStep === number ? "text-indigo-600" : "text-gray-500"
        }`}
      >
        {label}
      </span>
    </li>
  );

  // Success screen
  if (isSubmitted) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500" />
          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            Leave Request Submitted
          </h2>
          <p className="mt-2 text-gray-600">
            Your leave request has been successfully submitted for approval.
          </p>
          <div className="mt-8">
            <button
              onClick={() => navigate("/dashboard/leave", { replace: true })}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <HomeIcon className="-ml-1 mr-2 h-5 w-5" />
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If user data is not available
  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                User data not available. Please log in again.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">New Leave Request</h1>
        <p className="mt-1 text-sm text-gray-500">
          Fill in the details below to submit a new leave request
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <nav className="flex items-center justify-center" aria-label="Progress">
          <ol className="flex items-center space-x-8">
            <StepIndicator
              number={1}
              currentStep={step}
              label="Leave Details"
            />
            <StepIndicator
              number={2}
              currentStep={step}
              label="Dates & Documents"
            />
            <StepIndicator
              number={3}
              currentStep={step}
              label="Review & Submit"
            />
          </ol>
        </nav>
      </div>

      {/* Submit Error Banner */}
      {submitError && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XMarkIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Basic Information */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Leave Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.leaveType}
                onChange={(e) =>
                  setFormData({ ...formData, leaveType: e.target.value })
                }
                className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border ${
                  errors.leaveType ? "border-red-300" : "border-gray-300"
                } focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md`}
              >
                <option value="">Select leave type</option>
                {leaveTypes.map((type) => {
                  const balance = getLeaveBalance(type);
                  const isExhausted = balance <= 0 && type !== "Unpaid Leave";

                  return (
                    <option key={type} value={type} disabled={isExhausted}>
                      {type} ({balance} days remaining)
                      {isExhausted && " - EXHAUSTED"}
                    </option>
                  );
                })}
              </select>
              {errors.leaveType && (
                <p className="mt-2 text-sm text-red-600">{errors.leaveType}</p>
              )}
              {formData.leaveType && !errors.leaveType && (
                <p className="mt-2 text-sm text-gray-500">
                  You have {getLeaveBalance(formData.leaveType)} days of{" "}
                  {formData.leaveType} remaining.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                className={`mt-1 shadow-sm block w-full sm:text-sm border ${
                  errors.reason ? "border-red-300" : "border-gray-300"
                } rounded-md focus:ring-indigo-500 focus:border-indigo-500`}
                placeholder="Please provide a detailed reason for your leave request"
              />
              {errors.reason && (
                <p className="mt-2 text-sm text-red-600">{errors.reason}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Emergency Contact Name
                </label>
                <input
                  type="text"
                  value={formData.emergencyContact}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emergencyContact: e.target.value,
                    })
                  }
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Emergency Contact Phone
                </label>
                <input
                  type="tel"
                  value={formData.emergencyPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, emergencyPhone: e.target.value })
                  }
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Dates and Documents */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Leave Dates <span className="text-red-500">*</span>
              </label>
              <DateRangePicker
                onChange={handleDateChange}
                ranges={dateRange}
                months={1}
                direction="horizontal"
                className="border border-gray-300 rounded-lg shadow-sm"
                minDate={new Date()}
              />
              <div className="mt-4 text-sm text-gray-600">
                <p>
                  Selected: {dateRange[0].startDate.toLocaleDateString()} to{" "}
                  {dateRange[0].endDate.toLocaleDateString()}
                </p>
                <p className="font-medium">Total Days: {calculateDays()}</p>

                {/* Display balance warning if applicable */}
                {formData.leaveType !== "Unpaid Leave" &&
                  !hasSufficientLeaveBalance(
                    formData.leaveType,
                    calculateDays()
                  ) && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-red-700 text-sm">
                        <ExclamationTriangleIcon className="h-4 w-4 inline mr-1" />
                        Insufficient {formData.leaveType} balance: You only have{" "}
                        {getLeaveBalance(formData.leaveType)} days remaining
                      </p>
                    </div>
                  )}

                {errors.dates && (
                  <p className="mt-2 text-sm text-red-600">{errors.dates}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supporting Documents (Optional)
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                      <span>Upload files</span>
                      <input
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
                  {fileUploadError && (
                    <p className="text-xs text-red-500">{fileUploadError}</p>
                  )}
                  {fileUploading && (
                    <p className="text-xs text-indigo-500">Uploading...</p>
                  )}
                </div>
              </div>

              {formData.supportingDocs.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Uploaded Documents
                  </h3>
                  <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                    {formData.supportingDocs.map((file) => (
                      <li
                        key={file.id}
                        className="pl-3 pr-4 py-3 flex items-center justify-between text-sm"
                      >
                        <div className="w-0 flex-1 flex items-center">
                          <DocumentTextIcon className="flex-shrink-0 h-5 w-5 text-gray-400" />
                          <span className="ml-2 flex-1 w-0 truncate">
                            {file.name}
                          </span>
                          <span className="ml-2 text-xs text-gray-500">
                            {(file.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(file.id)}
                          className="ml-4 flex-shrink-0 text-red-600 hover:text-red-500"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Leave Request Summary
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Please review your leave request details before submitting
                </p>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">
                      Leave Type
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formData.leaveType} (
                      {getLeaveBalance(formData.leaveType)} days remaining)
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Dates</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {dateRange[0].startDate.toLocaleDateString()} to{" "}
                      {dateRange[0].endDate.toLocaleDateString()} (
                      {calculateDays()} days)
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">
                      Reason
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
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
                        <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                          {formData.supportingDocs.map((file) => (
                            <li
                              key={file.id}
                              className="pl-3 pr-4 py-3 flex items-center justify-between text-sm"
                            >
                              <div className="w-0 flex-1 flex items-center">
                                <DocumentTextIcon className="flex-shrink-0 h-5 w-5 text-gray-400" />
                                <span className="ml-2 flex-1 w-0 truncate">
                                  {file.name}
                                </span>
                                <span className="ml-2 text-xs text-gray-500">
                                  {(file.size / 1024).toFixed(1)} KB
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        "No documents attached"
                      )}
                    </dd>
                  </div>
                </dl>

                {/* Balance Warning in Review Step */}
                {formData.leaveType !== "Unpaid Leave" &&
                  !hasSufficientLeaveBalance(
                    formData.leaveType,
                    calculateDays()
                  ) && (
                    <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
                      <div className="flex">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                        <p className="ml-3 text-sm text-red-700">
                          You are requesting {calculateDays()} days of{" "}
                          {formData.leaveType}, but you only have{" "}
                          {getLeaveBalance(formData.leaveType)} days remaining.
                        </p>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ChevronLeftIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
              Back
            </button>
          )}
          <div className="ml-auto">
            {step < 3 ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={
                  (step === 1 && !formData.leaveType) ||
                  (step === 2 &&
                    (calculateDays() < 1 ||
                      (formData.leaveType !== "Unpaid Leave" &&
                        !hasSufficientLeaveBalance(
                          formData.leaveType,
                          calculateDays()
                        ))))
                }
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRightIcon className="ml-2 -mr-1 h-5 w-5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  (formData.leaveType !== "Unpaid Leave" &&
                    !hasSufficientLeaveBalance(
                      formData.leaveType,
                      calculateDays()
                    ))
                }
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-75"
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
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default NewLeaveRequest;
