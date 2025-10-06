// src/components/NewLeaveRequest.jsx
import React, { useEffect,useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ApiService, useApiInterceptors } from "../api/web-api-service";
import {
  LeaveRequestProvider,
  useLeaveRequest,
} from "../contexts/LeaveRequestContext";
import LeaveDetailsStep from "./LeaveRequestSteps/LeaveDetailsStep";
import DatesAndDocumentsStep from "./LeaveRequestSteps/DatesAndDocumentsStep";
import ReviewStep from "./LeaveRequestSteps/ReviewStep";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  HomeIcon,
} from "@heroicons/react/24/outline";

// Step Indicator (can stay here or extract)
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
      {currentStep > number ? <CheckCircleIcon className="w-5 h-5" /> : number}
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

// Inner component that uses context
const NewLeaveRequestInner = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    step,
    isSubmitted,
    setIsSubmitted,
    setFormData,
    setStartDate,
    setEndDate,
    setErrors,
    setStep,
    admins,
    setAdmins,
  } = useLeaveRequest();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useApiInterceptors();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch admins
  useEffect(() => {
    const fetchAdmins = async () => {
      if (!user?.id) return;
      try {
        const response = await ApiService.get("/users/admins/list");
        let users = [];
        if (Array.isArray(response.data)) users = response.data;
        else if (response.data && Array.isArray(response.data.data))
          users = response.data.data;
        else if (response.data && Array.isArray(response.data.users))
          users = response.data.users;

        const otherAdmins = users.filter((admin) => admin.id !== user.id);
        setAdmins(otherAdmins);
      } catch (error) {
        console.error("Error fetching admins:", error);
        setAdmins([]);
      }
    };
    fetchAdmins();
  }, [user?.id]);

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
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
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
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              Submit Another Request
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-2 text-sm text-red-700">
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
          Fill in the details below to submit a new leave request.
        </p>
      </div>

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

      {step === 1 && <LeaveDetailsStep />}
      {step === 2 && <DatesAndDocumentsStep />}
      {step === 3 && <ReviewStep />}
    </div>
  );
};

// Main exported component wrapped in provider
const NewLeaveRequest = () => {
  return (
    <LeaveRequestProvider>
      <NewLeaveRequestInner />
    </LeaveRequestProvider>
  );
};

export default NewLeaveRequest;
