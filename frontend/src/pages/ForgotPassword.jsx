import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  EnvelopeIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
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
  const [step, setStep] = useState(1);
  const [countdown, setCountdown] = useState(0);
  const [otpResent, setOtpResent] = useState(false);

  /* =======================
     SEO
     ======================= */
  const pageTitle = "Reset Password – FlexiLeave";
  const pageDescription =
    "Reset your FlexiLeave account password securely using OTP verification.";
  const canonicalUrl = `${window.location.origin}/forgot-password`;

  /* =======================
     COUNTDOWN
     ======================= */
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  /* =======================
     VALIDATION
     ======================= */
  const validateEmail = () => {
    const err = {};
    if (!formData.email) err.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      err.email = "Invalid email address";
    setErrors(err);
    return !Object.keys(err).length;
  };

  const validateOtp = () => {
    const err = {};
    if (formData.otp.length !== 6)
      err.otp = "Enter the 6-digit verification code";
    setErrors(err);
    return !Object.keys(err).length;
  };

  const validatePassword = () => {
    const err = {};
    if (formData.password.length < 8)
      err.password = "Minimum 8 characters required";
    else if (!/[A-Z]/.test(formData.password))
      err.password = "Must include an uppercase letter";
    else if (!/[0-9]/.test(formData.password))
      err.password = "Must include a number";
    else if (!/[^A-Za-z0-9]/.test(formData.password))
      err.password = "Must include a special character";

    if (formData.password !== formData.confirmPassword)
      err.confirmPassword = "Passwords do not match";

    setErrors(err);
    return !Object.keys(err).length;
  };

  /* =======================
     HANDLERS
     ======================= */
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({});
  };

  const handleOtpChange = (e, index) => {
    if (!/^\d?$/.test(e.target.value)) return;

    const otp = formData.otp.split("");
    otp[index] = e.target.value;
    const joined = otp.join("").slice(0, 6);

    setFormData({ ...formData, otp: joined });

    if (e.target.value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }

    if (joined.length === 6) handleVerifyOtp();
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!validateEmail()) return;

    setIsLoading(true);
    setTimeout(() => {
      setStep(2);
      setCountdown(120);
      setIsLoading(false);
    }, 1000);
  };

  const handleVerifyOtp = async () => {
    if (!validateOtp()) return;

    setIsLoading(true);
    setTimeout(() => {
      setStep(3);
      setIsLoading(false);
    }, 1000);
  };

  const handleResendOtp = () => {
    setIsLoading(true);
    setTimeout(() => {
      setCountdown(120);
      setOtpResent(true);
      setIsLoading(false);
    }, 1000);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;

    setIsLoading(true);
    setTimeout(() => {
      setStep(4);
      setIsLoading(false);
    }, 1200);
  };

  const formatTime = (s) =>
    `${Math.floor(s / 60)}:${s % 60 < 10 ? "0" : ""}${s % 60}`;

  /* =======================
     UI
     ======================= */
  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
          {/* HEADER */}
          <button
            onClick={() => navigate("/login")}
            className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1" /> Back to login
          </button>

          {/* STEP 1 */}
          {step === 1 && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Forgot Password
              </h1>
              <p className="text-sm text-gray-500 mb-6">
                Enter your FlexiLeave email to receive a verification code.
              </p>

              <form onSubmit={handleRequestOtp}>
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <div className="relative mt-1">
                    <EnvelopeIcon className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="you@company.com"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.email}
                    </p>
                  )}
                </div>

                <button
                  disabled={isLoading}
                  className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                  {isLoading ? "Sending..." : "Send OTP"}
                </button>
              </form>
            </>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <>
              <h2 className="text-xl font-semibold mb-2">
                Verify your email
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Enter the 6-digit code sent to your email.
              </p>

              <div className="flex justify-between mb-4">
                {[...Array(6)].map((_, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    maxLength="1"
                    className="w-12 h-12 text-center text-lg border rounded-lg"
                    onChange={(e) => handleOtpChange(e, i)}
                  />
                ))}
              </div>

              {errors.otp && (
                <p className="text-red-500 text-xs mb-3">{errors.otp}</p>
              )}

              <div className="flex items-center justify-between text-sm">
                {countdown > 0 ? (
                  <span className="flex items-center text-gray-500">
                    <ClockIcon className="w-4 h-4 mr-1" />
                    Resend in {formatTime(countdown)}
                  </span>
                ) : (
                  <button
                    onClick={handleResendOtp}
                    className="text-indigo-600 hover:underline"
                  >
                    Resend code
                  </button>
                )}

                {otpResent && (
                  <span className="text-green-600 text-xs">
                    Code resent
                  </span>
                )}
              </div>
            </>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <>
              <h2 className="text-xl font-semibold mb-4">
                Create new password
              </h2>

              <form onSubmit={handleResetPassword}>
                <input
                  type="password"
                  name="password"
                  placeholder="New password"
                  className="w-full mb-3 p-2 border rounded-lg"
                  onChange={handleChange}
                />
                {errors.password && (
                  <p className="text-red-500 text-xs mb-2">
                    {errors.password}
                  </p>
                )}

                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm password"
                  className="w-full mb-4 p-2 border rounded-lg"
                  onChange={handleChange}
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mb-2">
                    {errors.confirmPassword}
                  </p>
                )}

                <button className="w-full bg-indigo-600 text-white py-2 rounded-lg">
                  Reset Password
                </button>
              </form>
            </>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="text-center">
              <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                Password Reset Successful
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                You can now log in using your new password.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg"
              >
                Go to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ForgotPasswordPage;
