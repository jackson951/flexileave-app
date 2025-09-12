// src/pages/leave/NewLeaveRequest.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DateRangePicker } from "react-date-range";
import "react-date-range/dist/styles.css"; // main style file
import "react-date-range/dist/theme/default.css"; // theme css file

import {
  DocumentTextIcon, // ✅ same name
  CalendarDaysIcon, // ⚠️ replaces CalendarIcon
  ArrowUpTrayIcon, // ⚠️ replaces UploadIcon
  XMarkIcon, // ⚠️ replaces XIcon
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

  const leaveTypes = [
    "Annual Leave",
    "Sick Leave",
    "Family Responsibility",
    "Unpaid Leave",
    "Other",
  ];

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.leaveType) {
      newErrors.leaveType = "Please select a leave type";
    }
    if (!formData.reason) {
      newErrors.reason = "Please provide a reason";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDateChange = (ranges) => {
    setDateRange([ranges.selection]);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + formData.supportingDocs.length > 5) {
      setFileUploadError("You can upload a maximum of 5 files");
      return;
    }

    setFileUploading(true);
    setFileUploadError("");

    // Simulate file upload
    setTimeout(() => {
      const newFiles = files.map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + " MB",
        type: file.type.split("/")[1] || file.type,
        uploadedAt: new Date().toISOString(),
      }));

      setFormData((prev) => ({
        ...prev,
        supportingDocs: [...prev.supportingDocs, ...newFiles],
      }));
      setFileUploading(false);
    }, 1500);
  };

  const removeFile = (id) => {
    setFormData((prev) => ({
      ...prev,
      supportingDocs: prev.supportingDocs.filter((file) => file.id !== id),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
      }
    } else {
      // Submit the form
      console.log("Form submitted:", {
        ...formData,
        startDate: dateRange[0].startDate,
        endDate: dateRange[0].endDate,
      });
      navigate("/leave", { state: { success: true } });
    }
  };

  const calculateDays = () => {
    const diffTime = Math.abs(dateRange[0].endDate - dateRange[0].startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

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
            <li className="flex items-center">
              <span
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step === 1
                    ? "bg-indigo-600 text-white"
                    : step > 1
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {step > 1 ? (
                  <svg
                    className="w-5 h-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  "1"
                )}
              </span>
              <span
                className={`ml-3 text-sm font-medium ${
                  step === 1 ? "text-indigo-600" : "text-gray-500"
                }`}
              >
                Leave Details
              </span>
            </li>
            <li className="flex items-center">
              <span
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step === 2
                    ? "bg-indigo-600 text-white"
                    : step > 2
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {step > 2 ? (
                  <svg
                    className="w-5 h-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  "2"
                )}
              </span>
              <span
                className={`ml-3 text-sm font-medium ${
                  step === 2 ? "text-indigo-600" : "text-gray-500"
                }`}
              >
                Dates & Documents
              </span>
            </li>
            <li className="flex items-center">
              <span
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step === 3
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                3
              </span>
              <span
                className={`ml-3 text-sm font-medium ${
                  step === 3 ? "text-indigo-600" : "text-gray-500"
                }`}
              >
                Review & Submit
              </span>
            </li>
          </ol>
        </nav>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label
                htmlFor="leaveType"
                className="block text-sm font-medium text-gray-700"
              >
                Leave Type <span className="text-red-500">*</span>
              </label>
              <select
                id="leaveType"
                name="leaveType"
                value={formData.leaveType}
                onChange={(e) =>
                  setFormData({ ...formData, leaveType: e.target.value })
                }
                className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border ${
                  errors.leaveType
                    ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                } focus:outline-none sm:text-sm rounded-md`}
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
              <label
                htmlFor="reason"
                className="block text-sm font-medium text-gray-700"
              >
                Reason for Leave <span className="text-red-500">*</span>
              </label>
              <textarea
                id="reason"
                name="reason"
                rows={3}
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                className={`mt-1 shadow-sm block w-full sm:text-sm border ${
                  errors.reason
                    ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                } rounded-md`}
                placeholder="Please provide a detailed reason for your leave request"
              />
              {errors.reason && (
                <p className="mt-2 text-sm text-red-600">{errors.reason}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="emergencyContact"
                  className="block text-sm font-medium text-gray-700"
                >
                  Emergency Contact Name
                </label>
                <input
                  type="text"
                  id="emergencyContact"
                  name="emergencyContact"
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
                <label
                  htmlFor="emergencyPhone"
                  className="block text-sm font-medium text-gray-700"
                >
                  Emergency Contact Phone
                </label>
                <input
                  type="tel"
                  id="emergencyPhone"
                  name="emergencyPhone"
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

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Leave Dates <span className="text-red-500">*</span>
              </label>
              <DateRangePicker
                onChange={handleDateChange}
                showSelectionPreview={true}
                moveRangeOnFirstSelection={false}
                months={2}
                ranges={dateRange}
                direction="horizontal"
                className="border border-gray-300 rounded-lg shadow-sm"
              />
              <div className="mt-4 text-sm text-gray-600">
                <p>
                  Selected: {dateRange[0].startDate.toLocaleDateString()} to{" "}
                  {dateRange[0].endDate.toLocaleDateString()}
                </p>
                <p>Total Days: {calculateDays()}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supporting Documents (Optional)
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                    >
                      <span>Upload files</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="sr-only"
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
                          <DocumentTextIcon
                            className="flex-shrink-0 h-5 w-5 text-gray-400"
                            aria-hidden="true"
                          />
                          <span className="ml-2 flex-1 w-0 truncate">
                            {file.name}
                          </span>
                          <span className="ml-2 text-xs text-gray-500">
                            {file.size}
                          </span>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => removeFile(file.id)}
                            className="font-medium text-red-600 hover:text-red-500"
                          >
                            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

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
                      {calculateDays()} day
                      {calculateDays() !== 1 ? "s" : ""})
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
                                <DocumentTextIcon
                                  className="flex-shrink-0 h-5 w-5 text-gray-400"
                                  aria-hidden="true"
                                />
                                <span className="ml-2 flex-1 w-0 truncate">
                                  {file.name}
                                </span>
                                <span className="ml-2 text-xs text-gray-500">
                                  {file.size}
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

        <div className="flex justify-between">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Back
            </button>
          )}
          <div className="ml-auto">
            {step < 3 ? (
              <button
                type="button"
                onClick={handleSubmit}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Submit Request
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default NewLeaveRequest;
