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

  const BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "";

  /* ================= SEO ================= */
  const pageTitle = "Login to FlexiLeave – Employee Leave Portal";
  const pageDescription =
    "Secure login to FlexiLeave. Manage your leave requests, approvals, and employee profile with ease.";
  const pageKeywords =
    "flexileave login, leave management system, employee leave portal, hr software";
  const canonicalUrl = `${window.location.origin}/login`;

  useEffect(() => {
    document.getElementById("email")?.focus();

    const savedEmail = localStorage.getItem("flexileave_email");
    const savedRememberMe =
      localStorage.getItem("flexileave_rememberMe") === "true";

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
    if (!formData.email.trim())
      newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Please enter a valid email address";

    if (!formData.password)
      newErrors.password = "Password is required";
    else if (formData.password.length < 8)
      newErrors.password = "Password must be at least 8 characters";

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
        { withCredentials: true }
      );

      const userData = response.data.user;

      if (formData.rememberMe) {
        localStorage.setItem("flexileave_email", formData.email);
        localStorage.setItem("flexileave_rememberMe", "true");
      } else {
        localStorage.removeItem("flexileave_email");
        localStorage.removeItem("flexileave_rememberMe");
      }

      await login({
        token: response.data.token,
        userData,
        rememberMe: formData.rememberMe,
      });

      navigate("/dashboard/leave");
    } catch (error) {
      setErrors({
        submit: error.response?.data?.message || "Login failed",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: pageTitle,
    description: pageDescription,
    url: canonicalUrl,
    mainEntity: {
      "@type": "WebApplication",
      name: "FlexiLeave",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web Browser",
      description: pageDescription,
    },
  };

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={pageKeywords} />
        <link rel="canonical" href={canonicalUrl} />

        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="FlexiLeave" />

        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />

        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>

        <link rel="preconnect" href={BASE_URL} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="w-full max-w-md bg-white/80 backdrop-blur rounded-3xl shadow-xl border">
            <div className="px-8 pt-8 pb-6 text-center">
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome Back
              </h1>
              <p className="text-gray-600">
                Sign in to FlexiLeave
              </p>
            </div>

            <form onSubmit={handleSubmit} className="px-8 space-y-6">
              {/* Email */}
              <div>
                <label className="text-sm font-medium">Email</label>
                <div className="relative">
                  <EnvelopeIcon className="h-5 w-5 absolute left-3 top-3.5 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10 w-full py-3 rounded-xl border"
                    placeholder="employee@flexileave.com"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-sm font-medium">Password</label>
                <div className="relative">
                  <LockClosedIcon className="h-5 w-5 absolute left-3 top-3.5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 pr-12 w-full py-3 rounded-xl border"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-3.5"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex justify-between items-center text-sm">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  Remember me
                </label>
                <a href="/forgot-password" className="text-indigo-600">
                  Forgot password?
                </a>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl text-white font-semibold bg-indigo-600 hover:bg-indigo-700"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="px-8 py-4 text-center text-xs text-gray-500">
              © {new Date().getFullYear()} FlexiLeave. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
