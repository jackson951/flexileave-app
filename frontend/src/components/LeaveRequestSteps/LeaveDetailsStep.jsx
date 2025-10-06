// src/components/LeaveRequestSteps/LeaveDetailsStep.jsx
import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useLeaveRequest } from "../../contexts/LeaveRequestContext";

const LeaveDetailsStep = () => {
  const { user } = useAuth();
  const {
    formData,
    setFormData,
    errors,
    setErrors,
    setStep,
    leaveTypeMapping = {
      "Annual Leave": "AnnualLeave",
      "Sick Leave": "SickLeave",
      "Family Responsibility": "FamilyResponsibility",
      "Unpaid Leave": "UnpaidLeave",
      Other: "Other",
    },
  } = useLeaveRequest();

  const leaveTypes = Object.keys(leaveTypeMapping);

  const getLeaveBalance = (leaveTypeDisplayName) => {
    if (!user?.leaveBalances) return 0;
    const backendType = leaveTypeMapping[leaveTypeDisplayName];
    return user.leaveBalances[backendType] || 0;
  };

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

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  return (
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
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
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
              setFormData({ ...formData, emergencyContact: e.target.value })
            }
            className={`mt-1 block w-full rounded-md border ${
              errors.emergencyContact ? "border-red-300" : "border-gray-300"
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
            <p className="mt-2 text-sm text-red-600">{errors.emergencyPhone}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-6">
        <button
          type="button"
          onClick={handleNext}
          disabled={
            !formData.leaveType ||
            !formData.reason ||
            formData.reason.length < 10
          }
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
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

export default LeaveDetailsStep;
