import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  EnvelopeIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import axios from "axios";
import { Helmet } from "react-helmet-async";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: email, 2: OTP, 3: new password, 4: success
  const [countdown, setCountdown] = useState(0);
  const [otpResent, setOtpResent] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  // SEO metadata
  const pageTitle = "Reset Password - Digititan Employee Portal";
  const pageDescription =
    "Securely reset your Digititan employee account password. Get OTP verification and create a new strong password for your account.";
  const pageKeywords =
    "digititan reset password, forgot password, employee portal, password recovery, OTP verification";
  const canonicalUrl = `${window.location.origin}/forgot-password`;

  // Timer effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Focus on first input when step changes
  useEffect(() => {
    if (step === 1) {
      document.getElementById("email")?.focus();
    } else if (step === 2) {
      document.getElementById("otp-0")?.focus();
    } else if (step === 3) {
      document.getElementById("password")?.focus();
    }
  }, [step]);

  const validateEmail = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateOTP = () => {
    const newErrors = {};
    if (!formData.otp || formData.otp.length !== 6) {
      newErrors.otp = "Please enter the 6-digit OTP";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
    const newErrors = {};
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password =
        "Password must contain at least one uppercase letter";
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = "Password must contain at least one number";
    } else if (!/[^A-Za-z0-9]/.test(formData.password)) {
      newErrors.password =
        "Password must contain at least one special character";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleOtpChange = (e, index) => {
    const value = e.target.value;
    if (value && !/^\d+$/.test(value)) return;

    // Update the OTP at the specific index
    const otpArray = formData.otp.split("");
    otpArray[index] = value;
    const newOtp = otpArray.join("").slice(0, 6);

    setFormData((prev) => ({
      ...prev,
      otp: newOtp,
    }));

    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }

    // Auto-submit when all digits are entered
    if (newOtp.length === 6) {
      handleVerifyOtp();
    }
  };

  const handleBackspace = (e, index) => {
    if (e.key === "Backspace" && !e.target.value && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!validateEmail()) return;

    setIsLoading(true);
    try {
      // Simulated API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setStep(2);
      setCountdown(120); // 2 minutes countdown
      setOtpResent(false);
    } catch (error) {
      setErrors({
        submit: "Failed to send OTP. Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      // Simulated API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setCountdown(120);
      setOtpResent(true);
      setErrors({});
    } catch (error) {
      setErrors({
        submit: "Failed to resend OTP. Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!validateOTP()) return;

    setIsLoading(true);
    try {
      // Simulated API call - would normally verify with backend
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setStep(3); // Move to password reset step
      setErrors({});
    } catch (error) {
      setErrors({
        submit: "Invalid OTP. Please try again or request a new code.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;

    setIsLoading(true);
    try {
      // Simulated API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setStep(4); // Show success message
      setErrors({});
    } catch (error) {
      setErrors({
        submit: "Failed to reset password. Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/login");
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: pageTitle,
    description: pageDescription,
    url: canonicalUrl,
    mainEntity: {
      "@type": "Service",
      name: "Password Reset Service",
      description: "Secure password recovery service for Digititan employees",
      serviceType: "Password Recovery",
      provider: {
        "@type": "Organization",
        name: "Digititan",
      },
    },
  };

  return (
    <>
      <Helmet>
        {/* Basic meta tags */}
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={pageKeywords} />
        <link rel="canonical" href={canonicalUrl} />

        {/* Open Graph meta tags */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="Digititan" />

        {/* Twitter Card meta tags */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />

        {/* Additional SEO meta tags */}
        <meta name="robots" content="index, follow" />
        <meta name="author" content="Digititan" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        {/* Structured data */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        {/* Schema.org markup for breadcrumbs */}
        <div
          itemScope
          itemType="https://schema.org/BreadcrumbList"
          className="hidden"
        >
          <span
            itemProp="itemListElement"
            itemScope
            itemType="https://schema.org/ListItem"
          >
            <a itemProp="item" href={window.location.origin}>
              <span itemProp="name">Home</span>
            </a>
            <meta itemProp="position" content="1" />
          </span>
          <span
            itemProp="itemListElement"
            itemScope
            itemType="https://schema.org/ListItem"
          >
            <a itemProp="item" href={`${window.location.origin}/login`}>
              <span itemProp="name">Login</span>
            </a>
            <meta itemProp="position" content="2" />
          </span>
          <span
            itemProp="itemListElement"
            itemScope
            itemType="https://schema.org/ListItem"
          >
            <a itemProp="item" href={canonicalUrl}>
              <span itemProp="name">Reset Password</span>
            </a>
            <meta itemProp="position" content="3" />
          </span>
        </div>

        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-md">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-2xl">
              <div className="px-8 pt-8 pb-6">
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {step === 1 && "Reset Your Password"}
                    {step === 2 && "Verify Your Email"}
                    {step === 3 && "Create New Password"}
                    {step === 4 && "Password Reset Successfully"}
                  </h1>
                  <p className="text-gray-600">
                    {step === 1 &&
                      "Enter your email address and we'll send you a verification code."}
                    {step === 2 &&
                      `We sent a 6-digit code to ${formData.email}. Enter it below.`}
                    {step === 3 &&
                      "Create a strong, new password for your account."}
                    {step === 4 &&
                      "Your password has been changed successfully. You can now sign in with your new password."}
                  </p>
                </div>

                {errors.submit && (
                  <div
                    className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-start"
                    role="alert"
                    aria-live="polite"
                  >
                    <ExclamationTriangleIcon
                      className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <span>{errors.submit}</span>
                  </div>
                )}

                {otpResent && (
                  <div
                    className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm flex items-start"
                    role="alert"
                    aria-live="polite"
                  >
                    <CheckCircleIcon
                      className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-green-600"
                      aria-hidden="true"
                    />
                    <span>A new OTP has been sent to your email.</span>
                  </div>
                )}

                {step === 1 && (
                  <form
                    onSubmit={handleRequestOtp}
                    className="space-y-6"
                    noValidate
                  >
                    <div className="space-y-2">
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <EnvelopeIcon
                            className={`h-5 w-5 ${
                              focusedField === "email"
                                ? "text-indigo-500"
                                : "text-gray-400"
                            }`}
                            aria-hidden="true"
                          />
                        </div>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          value={formData.email}
                          onChange={handleChange}
                          onFocus={() => setFocusedField("email")}
                          onBlur={() => setFocusedField(null)}
                          className={`block w-full pl-10 pr-3 py-3.5 rounded-xl border ${
                            errors.email
                              ? "border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50"
                              : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                          } focus:outline-none text-sm font-medium`}
                          placeholder="employee@digititan.com"
                          aria-describedby={errors.email ? "email-error" : null}
                          aria-invalid={errors.email ? "true" : "false"}
                          required
                        />
                      </div>
                      {errors.email && (
                        <p
                          id="email-error"
                          className="text-xs text-red-600 flex items-center"
                          role="alert"
                        >
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {errors.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 ${
                          isLoading ? "opacity-75 cursor-not-allowed" : ""
                        }`}
                        aria-label={
                          isLoading
                            ? "Sending verification code"
                            : "Send verification code to reset password"
                        }
                      >
                        {isLoading ? (
                          <>
                            <svg
                              className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
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
                            Sending...
                          </>
                        ) : (
                          "Send Verification Code"
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Enter 6-digit code
                      </label>
                      <div className="flex justify-between space-x-2">
                        {[0, 1, 2, 3, 4, 5].map((index) => (
                          <input
                            key={index}
                            id={`otp-${index}`}
                            type="text"
                            maxLength="1"
                            value={formData.otp[index] || ""}
                            onChange={(e) => handleOtpChange(e, index)}
                            onKeyDown={(e) => handleBackspace(e, index)}
                            className={`block w-full text-center py-3 px-2 rounded-xl border ${
                              errors.otp
                                ? "border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50"
                                : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                            } focus:outline-none text-lg font-bold`}
                            inputMode="numeric"
                            aria-describedby={errors.otp ? "otp-error" : null}
                            aria-invalid={errors.otp ? "true" : "false"}
                            required
                          />
                        ))}
                      </div>
                      {errors.otp && (
                        <p
                          id="otp-error"
                          className="text-xs text-red-600 flex items-center"
                          role="alert"
                        >
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {errors.otp}
                        </p>
                      )}
                    </div>

                    <div className="text-center text-sm text-gray-500">
                      {countdown > 0 ? (
                        <div className="flex items-center justify-center">
                          <ClockIcon
                            className="w-4 h-4 mr-1 text-gray-400"
                            aria-hidden="true"
                          />
                          <span>Code expires in {formatTime(countdown)}</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={isLoading}
                          className="text-indigo-600 hover:text-indigo-500 font-medium"
                          aria-label="Resend verification code"
                        >
                          Didn't receive code? Resend
                        </button>
                      )}
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={isLoading || formData.otp.length !== 6}
                        className={`w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 ${
                          isLoading || formData.otp.length !== 6
                            ? "opacity-75 cursor-not-allowed"
                            : ""
                        }`}
                        aria-label={
                          isLoading ? "Verifying OTP code" : "Verify OTP code"
                        }
                      >
                        {isLoading ? (
                          <>
                            <svg
                              className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
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
                            Verifying...
                          </>
                        ) : (
                          "Verify Code"
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <form
                    onSubmit={handleResetPassword}
                    className="space-y-6"
                    noValidate
                  >
                    <div className="space-y-2">
                      <label
                        htmlFor="password"
                        className="block text-sm font-medium text-gray-700"
                      >
                        New Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <LockClosedIcon
                            className={`h-5 w-5 ${
                              focusedField === "password"
                                ? "text-indigo-500"
                                : "text-gray-400"
                            }`}
                            aria-hidden="true"
                          />
                        </div>
                        <input
                          id="password"
                          name="password"
                          type="password"
                          autoComplete="new-password"
                          value={formData.password}
                          onChange={handleChange}
                          onFocus={() => setFocusedField("password")}
                          onBlur={() => setFocusedField(null)}
                          className={`block w-full pl-10 pr-3 py-3.5 rounded-xl border ${
                            errors.password
                              ? "border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50"
                              : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                          } focus:outline-none text-sm font-medium`}
                          placeholder="Enter new password"
                          aria-describedby={
                            errors.password
                              ? "password-error"
                              : "password-requirements"
                          }
                          aria-invalid={errors.password ? "true" : "false"}
                          required
                          minLength="8"
                        />
                      </div>
                      {errors.password && (
                        <p
                          id="password-error"
                          className="text-xs text-red-600 flex items-center"
                          role="alert"
                        >
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {errors.password}
                        </p>
                      )}
                      <div
                        id="password-requirements"
                        className="text-xs text-gray-500"
                      >
                        Password must be at least 8 characters with uppercase,
                        number, and special character
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="confirmPassword"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Confirm Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <ShieldCheckIcon
                            className={`h-5 w-5 ${
                              focusedField === "confirmPassword"
                                ? "text-indigo-500"
                                : "text-gray-400"
                            }`}
                            aria-hidden="true"
                          />
                        </div>
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          autoComplete="new-password"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          onFocus={() => setFocusedField("confirmPassword")}
                          onBlur={() => setFocusedField(null)}
                          className={`block w-full pl-10 pr-3 py-3.5 rounded-xl border ${
                            errors.confirmPassword
                              ? "border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50"
                              : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                          } focus:outline-none text-sm font-medium`}
                          placeholder="Confirm new password"
                          aria-describedby={
                            errors.confirmPassword
                              ? "confirm-password-error"
                              : null
                          }
                          aria-invalid={
                            errors.confirmPassword ? "true" : "false"
                          }
                          required
                        />
                      </div>
                      {errors.confirmPassword && (
                        <p
                          id="confirm-password-error"
                          className="text-xs text-red-600 flex items-center"
                          role="alert"
                        >
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {errors.confirmPassword}
                        </p>
                      )}
                    </div>

                    <div>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 ${
                          isLoading ? "opacity-75 cursor-not-allowed" : ""
                        }`}
                        aria-label={
                          isLoading ? "Resetting password" : "Reset password"
                        }
                      >
                        {isLoading ? (
                          <>
                            <svg
                              className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
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
                            Resetting...
                          </>
                        ) : (
                          "Reset Password"
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {step === 4 && (
                  <div className="text-center space-y-6">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                      <CheckCircleIcon
                        className="h-10 w-10 text-green-600"
                        aria-hidden="true"
                      />
                    </div>
                    <div>
                      <h2 className="text-lg font-medium text-gray-900">
                        Password Reset Successful
                      </h2>
                      <p className="mt-2 text-sm text-gray-500">
                        Your password has been updated successfully. You can now
                        sign in with your new password.
                      </p>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={handleBackToLogin}
                        className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                        aria-label="Return to login page"
                      >
                        Back to Sign In
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-8 py-4 bg-gray-50 border-t border-gray-100">
                <div className="flex items-center justify-center text-xs text-gray-500">
                  <svg
                    className="h-4 w-4 mr-1 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    ></path>
                  </svg>
                  <span>Secure & Encrypted Connection</span>
                </div>
              </div>
            </div>

            {/* Bottom Links */}
            <div className="mt-6 text-center space-y-3">
              {step !== 4 && (
                <p className="text-sm text-gray-600">
                  <button
                    onClick={handleBackToLogin}
                    className="font-medium text-indigo-600 hover:text-indigo-500 inline-flex items-center transition-colors duration-200"
                    aria-label="Go back to login page"
                  >
                    <ArrowLeftIcon
                      className="h-4 w-4 mr-1"
                      aria-hidden="true"
                    />
                    Back to Sign In
                  </button>
                </p>
              )}
              <p className="text-xs text-gray-400">
                © {new Date().getFullYear()} Digititan. All rights reserved. •
                v2.1.0
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPasswordPage;
