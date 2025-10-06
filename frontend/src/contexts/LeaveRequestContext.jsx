// src/contexts/LeaveRequestContext.js
import React, { createContext, useContext, useState } from "react";

const LeaveRequestContext = createContext();

export const useLeaveRequest = () => {
  const context = useContext(LeaveRequestContext);
  if (!context) {
    throw new Error(
      "useLeaveRequest must be used within a LeaveRequestProvider"
    );
  }
  return context;
};

export const LeaveRequestProvider = ({ children }) => {
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [admins, setAdmins] = useState([]);

  return (
    <LeaveRequestContext.Provider
      value={{
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
        isSubmitting,
        setIsSubmitting,
        submitError,
        setSubmitError,
        step,
        setStep,
        isSubmitted,
        setIsSubmitted,
        admins,
        setAdmins,
      }}
    >
      {children}
    </LeaveRequestContext.Provider>
  );
};
