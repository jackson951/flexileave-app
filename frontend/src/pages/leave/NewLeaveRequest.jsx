import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
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
  InformationCircleIcon,
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
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [errors, setErrors] = useState({});
  const [fileUploading, setFileUploading] = useState(false);
  const [fileUploadError, setFileUploadError] = useState("");
  const [fileDeleteError, setFileDeleteError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [admins, setAdmins] = useState([]);

  // Initialize interceptors
  useApiInterceptors();

  // Handle window resize for responsiveness
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch admins for notifications
  // Fetch admins for notifications
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const response = await ApiService.get("/users/admins/list");
        console.log("Full API response:", response);

        // Handle different response structures
        let users = [];
        if (Array.isArray(response.data)) {
          users = response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
          users = response.data.data; // If nested under data property
        } else if (response.data && Array.isArray(response.data.users)) {
          users = response.data.users; // If nested under users property
        }

        console.log("Extracted users:", users);

        // Filter for admins
        const allAdmins = users;
        console.log("All admins found:", allAdmins);

        // Get current user ID for comparison
        const currentUserId = user?.id;
        console.log("Current user ID for filtering:", currentUserId);

        // Filter out current user
        const otherAdmins = allAdmins.filter((admin) => {
          const isDifferentUser = admin.id !== currentUserId;
          console.log(
            `Admin ${admin.id} vs current ${currentUserId}: ${isDifferentUser}`
          );
          return isDifferentUser;
        });

        console.log("Final admins to notify:", otherAdmins);
        setAdmins(otherAdmins);
      } catch (error) {
        console.error("Error fetching admins:", error);
        console.error("Error details:", error.response?.data);
        setAdmins([]);
      }
    };

    // Only fetch if user is loaded
    if (user && user.id) {
      fetchAdmins();
    } else {
      console.log("User not loaded yet, skipping admin fetch");
    }
  }, [user, user?.id]); // Depend on entire user object and user.id
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

  // Calculate total days between dates
  const calculateDays = () => {
    if (!startDate || !endDate) return 0;

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Reset time part to avoid timezone issues
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(end - start);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates

    return diffDays;
  };

  // Validate if requested days exceed available balance
  const hasSufficientLeaveBalance = (leaveType, requestedDays) => {
    if (!leaveType || leaveType === "Unpaid Leave") return true;
    const availableBalance = getLeaveBalance(leaveType);
    return requestedDays <= availableBalance;
  };

  // Get minimum end date (same as start date or later)
  const getMinEndDate = () => {
    return startDate || new Date().toISOString().split("T")[0];
  };

  // Validate Step 1
  const validateStep1 = () => {
    const newErrors = {};

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
    } else if (formData.reason.length < 10) {
      newErrors.reason = "Reason must be at least 10 characters long";
    }

    // Validate emergency contact fields
    if (formData.emergencyContact && !formData.emergencyPhone) {
      newErrors.emergencyPhone =
        "Emergency phone is required when contact name is provided";
    }
    if (formData.emergencyPhone && !formData.emergencyContact) {
      newErrors.emergencyContact =
        "Contact name is required when emergency phone is provided";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate Step 2
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

    // Skip balance check for unpaid leave
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

  // Handle date changes
  const handleStartDateChange = (e) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);

    // If end date is before new start date, clear end date
    if (endDate && new Date(endDate) < new Date(newStartDate)) {
      setEndDate("");
    }

    // Clear date errors when dates change
    if (errors.dates) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.dates;
        return newErrors;
      });
    }
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);

    // Clear date errors when dates change
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
    if (files.length === 0) return;

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

      const response = await ApiService.post("/leaves/upload", uploadFormData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setFormData((prev) => ({
        ...prev,
        supportingDocs: [...prev.supportingDocs, ...response.data],
      }));

      setFileUploadError("");
    } catch (err) {
      console.error("Error uploading files:", err);
      setFileUploadError(
        err.response?.data?.message ||
          "Failed to upload files. Please check file size (max 10MB) and type (PDF, DOC, JPG, PNG)."
      );
    } finally {
      setFileUploading(false);
    }
  };

  // Remove file
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
      console.error("Error deleting file:", err);
      setFileDeleteError(
        err.response?.data?.message ||
          "Failed to delete file. It may be attached to another request."
      );
    }
  };

  // Create notifications for admins
  const createAdminNotifications = async (leaveId, leaveData) => {
    try {
      // Create notifications for each admin
      const notificationPromises = admins.map(async (admin) => {
        const notificationData = {
          userId: admin.id,
          type: "leave_submitted",
          title: "New Leave Request Submitted",
          message: `${user.name} has submitted a new ${
            formData.leaveType
          } request for ${calculateDays()} day${
            calculateDays() !== 1 ? "s" : ""
          } (${formatDate(startDate)} - ${formatDate(endDate)})`,
          leaveId: leaveId,
        };

        return ApiService.post("/notifications", notificationData);
      });

      await Promise.all(notificationPromises);
      console.log(`Created notifications for ${admins.length} admins`);
    } catch (error) {
      console.error("Error creating admin notifications:", error);
      // Don't throw error here - the leave request was already created successfully
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
          leaveType: leaveTypeMapping[formData.leaveType],
          reason: formData.reason,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          days: requestedDays,
          emergencyContact: formData.emergencyContact || null,
          emergencyPhone: formData.emergencyPhone || null,
          fileIds: formData.supportingDocs.map((doc) => doc.id),
        };

        // Create the leave request
        const response = await ApiService.post("/leaves", leaveData);
        const createdLeave = response.data;

        // Create notifications for admins
        if (admins.length > 0) {
          await createAdminNotifications(createdLeave.id, leaveData);
        }

        setIsSubmitted(true);
      } catch (err) {
        console.error("Error submitting leave request:", err);
        setSubmitError(
          err.response?.data?.message ||
            "Failed to submit leave request. Please try again."
        );
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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
        className={`ml-3 text-sm font-medium hidden sm:inline ${
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
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
            <CheckCircleIcon className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            Leave Request Submitted
          </h2>
          <p className="mt-2 text-gray-600">
            Your leave request has been successfully submitted for approval.
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {admins.length > 0
              ? `Notification has been sent to ${admins.length} admin${
                  admins.length !== 1 ? "s" : ""
                } for review.`
              : "Your request is pending admin review."}
          </p>
          <div className="mt-8 space-x-4">
            <button
              onClick={() => navigate("/dashboard/leave", { replace: true })}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
            >
              <HomeIcon className="-ml-1 mr-2 h-5 w-5" />
              Return to Dashboard
            </button>
            <button
              onClick={() => {
                setIsSubmitted(false);
                setStep(1);
                setFormData({
                  leaveType: "",
                  reason: "",
                  supportingDocs: [],
                  emergencyContact: "",
                  emergencyPhone: "",
                });
                setStartDate("");
                setEndDate("");
                setErrors({});
              }}
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Submit Another Request
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
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon
                className="h-5 w-5 text-red-400"
                aria-hidden="true"
              />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>User data not available. Please log in again.</p>
              </div>
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
          Fill in the details below to submit a new leave request.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <nav className="flex items-center justify-center" aria-label="Progress">
          <ol className="flex items-center space-x-2 sm:space-x-8">
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

      {/* Error Banners */}
      {submitError && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon
                className="h-5 w-5 text-red-400"
                aria-hidden="true"
              />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Submission Failed
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{submitError}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {(fileUploadError || fileDeleteError) && (
        <div className="mb-6 rounded-md bg-yellow-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <InformationCircleIcon
                className="h-5 w-5 text-yellow-400"
                aria-hidden="true"
              />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                File Operation Issue
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>{fileUploadError || fileDeleteError}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Basic Information */}
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
                value={formData.leaveType}
                onChange={(e) =>
                  setFormData({ ...formData, leaveType: e.target.value })
                }
                className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border ${
                  errors.leaveType ? "border-red-300" : "border-gray-300"
                } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md`}
              >
                <option value="">Select leave type</option>
                {leaveTypes.map((type) => {
                  const balance = getLeaveBalance(type);
                  const isExhausted = balance <= 0 && type !== "Unpaid Leave";

                  return (
                    <option key={type} value={type} disabled={isExhausted}>
                      {type} ({balance} day{balance !== 1 ? "s" : ""} remaining)
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
                  You have {getLeaveBalance(formData.leaveType)} day
                  {getLeaveBalance(formData.leaveType) !== 1 ? "s" : ""} of{" "}
                  {formData.leaveType} remaining.
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="reason"
                className="block text-sm font-medium text-gray-700"
              >
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                id="reason"
                rows={4}
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                className={`mt-1 block w-full rounded-md border ${
                  errors.reason ? "border-red-300" : "border-gray-300"
                } shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm`}
                placeholder="Please provide a detailed reason for your leave request (minimum 10 characters)"
              />
              {errors.reason && (
                <p className="mt-2 text-sm text-red-600">{errors.reason}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {formData.reason.length}/10 characters minimum
              </p>
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
                  value={formData.emergencyContact}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emergencyContact: e.target.value,
                    })
                  }
                  className={`mt-1 block w-full rounded-md border ${
                    errors.emergencyContact
                      ? "border-red-300"
                      : "border-gray-300"
                  } shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm`}
                />
                {errors.emergencyContact && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.emergencyContact}
                  </p>
                )}
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
                  value={formData.emergencyPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, emergencyPhone: e.target.value })
                  }
                  className={`mt-1 block w-full rounded-md border ${
                    errors.emergencyPhone ? "border-red-300" : "border-gray-300"
                  } shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm`}
                />
                {errors.emergencyPhone && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.emergencyPhone}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Dates and Documents */}
        {step === 2 && (
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
                    <span className="font-medium text-gray-700">
                      Start Date:
                    </span>
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
                    <span className="font-medium text-gray-700">
                      Total Days:
                    </span>
                    <p className="text-lg font-bold text-indigo-600">
                      {calculateDays()} day{calculateDays() !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                {/* Balance warning */}
                {formData.leaveType &&
                  formData.leaveType !== "Unpaid Leave" && (
                    <div
                      className={`mt-3 p-3 rounded-md ${
                        hasSufficientLeaveBalance(
                          formData.leaveType,
                          calculateDays()
                        )
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
                      className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2"
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
                        className="pl-3 pr-3 py-3 flex items-center justify-between text-sm hover:bg-gray-100 transition-colors duration-150"
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
                          className="ml-2 flex-shrink-0 inline-flex items-center p-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-150"
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
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
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
                    <dt className="text-sm font-medium text-gray-500">
                      Leave Type
                    </dt>
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
                    <dt className="text-sm font-medium text-gray-500">
                      Start Date
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 font-medium">
                      {formatDate(startDate)}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">
                      End Date
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 font-medium">
                      {formatDate(endDate)}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">
                      Total Days
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 font-bold">
                      {calculateDays()} day{calculateDays() !== 1 ? "s" : ""}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">
                      Reason
                    </dt>
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
                              className="pl-3 pr-3 py-3 flex items-center justify-between text-sm"
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

                {/* Balance Status in Review Step */}
                <div
                  className={`mt-6 p-4 rounded-md ${
                    formData.leaveType === "Unpaid Leave"
                      ? "bg-blue-50 border border-blue-200"
                      : hasSufficientLeaveBalance(
                          formData.leaveType,
                          calculateDays()
                        )
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
                              getLeaveBalance(formData.leaveType) -
                              calculateDays()
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
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between pt-6">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
            >
              <ChevronLeftIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
              Back
            </button>
          ) : (
            <div></div> // Empty div to maintain flex layout
          )}

          <div className="ml-auto">
            {step < 3 ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={
                  (step === 1 &&
                    (!formData.leaveType ||
                      !formData.reason ||
                      formData.reason.length < 10)) ||
                  (step === 2 &&
                    (!startDate || !endDate || calculateDays() < 1))
                }
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
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
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-75 transition-colors duration-150"
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
