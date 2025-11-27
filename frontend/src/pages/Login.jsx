import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LockClosedIcon,
  EnvelopeIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import { Helmet } from "react-helmet-async";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  // Express API base URL - Clean trailing slash to prevent double slashes
  const BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "";

  // SEO metadata
  const pageTitle = "Login to myleaveapp - Employee Portal";
  const pageDescription =
    "Secure login access to myleaveapp's employee dashboard. Manage your leave, profile, and work resources.";
  const pageKeywords =
    "myleaveapp login, employee portal, secure login, hr system, leave management";
  const canonicalUrl = `${window.location.origin}/login`;

  useEffect(() => {
    const emailInput = document.getElementById("email");
    if (emailInput) emailInput.focus();

    const savedEmail = localStorage.getItem("myleaveapp_email");
    const savedRememberMe =
      localStorage.getItem("myleaveapp_rememberMe") === "true";
    if (savedEmail && savedRememberMe) {
      setFormData((prev) => ({
        ...prev,
        email: savedEmail,
        rememberMe: true,
      }));
    }
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await axios.post(
        `${BASE_URL}/auth/login`,
        {
          email: formData.email,
          password: formData.password,
        },
        {
          withCredentials: true,
        }
      );

      const userData = response.data.user;

      // Store credentials if remember me is checked
      if (formData.rememberMe) {
        localStorage.setItem("myleaveapp_email", formData.email);
        localStorage.setItem("myleaveapp_rememberMe", "true");
      } else {
        localStorage.removeItem("myleaveapp_email");
        localStorage.removeItem("myleaveapp_rememberMe");
      }

      await login({
        token: response.data.token,
        userData,
        rememberMe: formData.rememberMe,
      });
      navigate("/dashboard/leave");
    } catch (error) {
      setErrors({ submit: error.response?.data?.message || "Login failed" });
    } finally {
      setIsLoading(false);
    }
  };

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: pageTitle,
    description: pageDescription,
    url: canonicalUrl,
    mainEntity: {
      "@type": "WebApplication",
      name: "myleaveapp Employee Portal",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web Browser",
      description: pageDescription,
      offers: {
        "@type": "Offer",
        category: "Free",
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
        <meta property="og:site_name" content="myleaveapp" />

        {/* Twitter Card meta tags */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />

        {/* Additional SEO meta tags */}
        <meta name="robots" content="index, follow" />
        <meta name="author" content="myleaveapp" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        {/* Structured data */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>

        {/* Preload critical resources */}
        <link rel="preconnect" href={BASE_URL} />
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
            <a itemProp="item" href={canonicalUrl}>
              <span itemProp="name">Login</span>
            </a>
            <meta itemProp="position" content="2" />
          </span>
        </div>

        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-md">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-2xl">
              <div className="px-8 pt-8 pb-6">
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Welcome Back
                  </h1>
                  <p className="text-gray-600">
                    Sign in to access your account
                  </p>
                </div>

                {errors.submit && (
                  <div
                    className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-start"
                    role="alert"
                    aria-live="polite"
                  >
                    <svg
                      className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>{errors.submit}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                  {/* Email Field */}
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
                        placeholder="employee@myleaveapp.com"
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

                  {/* Password Field */}
                  <div className="space-y-2">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Password
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
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        value={formData.password}
                        onChange={handleChange}
                        onFocus={() => setFocusedField("password")}
                        onBlur={() => setFocusedField(null)}
                        className={`block w-full pl-10 pr-12 py-3.5 rounded-xl border ${
                          errors.password
                            ? "border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50"
                            : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                        } focus:outline-none text-sm font-medium`}
                        placeholder="••••••••"
                        aria-describedby={
                          errors.password ? "password-error" : null
                        }
                        aria-invalid={errors.password ? "true" : "false"}
                        required
                        minLength="8"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        aria-pressed={showPassword}
                      >
                        {showPassword ? (
                          <EyeSlashIcon
                            className="h-5 w-5"
                            aria-hidden="true"
                          />
                        ) : (
                          <EyeIcon className="h-5 w-5" aria-hidden="true" />
                        )}
                      </button>
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
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        id="remember-me"
                        name="rememberMe"
                        type="checkbox"
                        checked={formData.rememberMe}
                        onChange={handleChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="remember-me"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        Remember me
                      </label>
                    </div>
                    <div className="text-sm">
                      <a
                        href="/forgot-password"
                        className="font-medium text-indigo-600 hover:text-indigo-500"
                        aria-label="Forgot your password? Reset it here"
                      >
                        Forgot password?
                      </a>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 ${
                        isLoading ? "opacity-75 cursor-not-allowed" : ""
                      }`}
                      aria-label={
                        isLoading
                          ? "Signing in to your account"
                          : "Sign in to your account"
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
                          Signing in...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Footer */}
              <div className="px-8 py-4 bg-gray-50 border-t border-gray-100">
                <div className="flex items-center justify-center text-xs text-gray-500">
                  <LockClosedIcon
                    className="h-4 w-4 mr-1 text-gray-400"
                    aria-hidden="true"
                  />
                  <span>Secure & Encrypted Connection</span>
                </div>
              </div>
            </div>

            {/* Bottom Links */}
            <div className="mt-6 text-center space-y-3">
              <p className="text-sm text-gray-600">
                Need help?{" "}
                <a
                  href="/support"
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                  aria-label="Contact our support team for assistance"
                >
                  Contact Support
                </a>
              </p>
              <p className="text-xs text-gray-400">
                © {new Date().getFullYear()} myleaveapp. All rights reserved. •
                v2.1.0
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
