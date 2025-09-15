import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
} from "@heroicons/react/24/outline";

const NewLeaveRequest = () => {
  const navigate = useNavigate();
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

  const leaveTypes = [
    "Annual Leave",
    "Sick Leave",
    "Family Responsibility",
    "Unpaid Leave",
    "Other",
  ];

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.leaveType) newErrors.leaveType = "Please select a leave type";
    if (!formData.reason) newErrors.reason = "Please provide a reason";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const days = calculateDays();
    return days >= 1;
  };

  const handleDateChange = (ranges) => {
    setDateRange([ranges.selection]);
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length + formData.supportingDocs.length > 5) {
      setFileUploadError("You can upload a maximum of 5 files");
      return;
    }

    setFileUploading(true);
    setFileUploadError("");

    try {
      const token = localStorage.getItem("authToken");
      const formData = new FormData();

      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("http://localhost:5000/api/leaves/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload files");
      }

      const uploadedFiles = await response.json();
      setFormData((prev) => ({
        ...prev,
        supportingDocs: [...prev.supportingDocs, ...uploadedFiles],
      }));
    } catch (err) {
      console.error("Error uploading files:", err);
      setFileUploadError(err.message);
    } finally {
      setFileUploading(false);
    }
  };

  const removeFile = async (fileId) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `http://localhost:5000/api/leaves/files/${fileId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete file");
      }

      setFormData((prev) => ({
        ...prev,
        supportingDocs: prev.supportingDocs.filter(
          (file) => file.id !== fileId
        ),
      }));
    } catch (err) {
      console.error("Error deleting file:", err);
      setFileUploadError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (step === 1 && validateStep1()) {
      setStep(2);
      return;
    }

    if (step === 2 && validateStep2()) {
      setStep(3);
      return;
    }

    if (step === 3) {
      setIsSubmitting(true);
      setSubmitError("");

      try {
        const token = localStorage.getItem("authToken");

        const leaveData = {
          leaveType: formData.leaveType,
          reason: formData.reason,
          startDate: dateRange[0].startDate.toISOString(),
          endDate: dateRange[0].endDate.toISOString(),
          days: calculateDays(),
          emergencyContact: formData.emergencyContact,
          emergencyPhone: formData.emergencyPhone,
          // ✅ CORRECT: Send array of file IDs
          fileIds: formData.supportingDocs.map((doc) => doc.id),
        };

        const response = await fetch("http://localhost:5000/api/leaves", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(leaveData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "Failed to submit leave request"
          );
        }

        setIsSubmitted(true);
      } catch (err) {
        console.error("Error submitting leave request:", err);
        setSubmitError(err.message);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const calculateDays = () => {
    const diffTime = Math.abs(dateRange[0].endDate - dateRange[0].startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

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
              onClick={() => navigate("/dashboard")}
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
                {leaveTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {errors.leaveType && (
                <p className="mt-2 text-sm text-red-600">{errors.leaveType}</p>
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
              />
              <div className="mt-4 text-sm text-gray-600">
                <p>
                  Selected: {dateRange[0].startDate.toLocaleDateString()} to{" "}
                  {dateRange[0].endDate.toLocaleDateString()}
                </p>
                <p className="font-medium">Total Days: {calculateDays()}</p>
                {calculateDays() < 1 && (
                  <p className="text-red-500">Please select valid dates</p>
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
                            {file.size} KB
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
                      {formData.leaveType}
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
                                  {file.size} KB
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
                disabled={step === 2 && calculateDays() < 1}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRightIcon className="ml-2 -mr-1 h-5 w-5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
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
