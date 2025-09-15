import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  HomeIcon,
} from "@heroicons/react/24/outline";

const NotFoundPage = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      {/* Animated SVG Illustration */}
      <div className="relative w-48 h-48 mb-8 overflow-hidden rounded-full shadow-xl">
        <svg
          viewBox="0 0 200 200"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
          style={{ transform: "scale(1.1)" }}
        >
          {/* Background Circle */}
          <circle cx="100" cy="100" r="90" fill="#f3f4f6" />

          {/* Warning Triangle */}
          <path
            d="M90,50 L110,50 L100,120 Z"
            fill="#ef4444"
            stroke="#dc2626"
            strokeWidth="3"
          />
          {/* Dot inside triangle */}
          <circle cx="100" cy="90" r="4" fill="#ffffff" />

          {/* Outer Glow */}
          <circle
            cx="100"
            cy="100"
            r="95"
            fill="none"
            stroke="#fca5a5"
            strokeWidth="2"
            opacity="0.5"
          />
        </svg>
      </div>

      {/* Main Content */}
      <div className="text-center max-w-md">
        <h1 className="text-7xl font-extrabold text-gray-800 tracking-tight mb-2">
          404
        </h1>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Page Not Found
        </h2>
        <p className="text-lg text-gray-600 leading-relaxed mb-8">
          Oops! The page you're looking for has either been moved, deleted, or
          doesn't exist. Our team is already working to fix it.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={handleGoBack}
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
            aria-label="Go back to previous page"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Go Back
          </button>

          <button
            onClick={handleGoHome}
            className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
            aria-label="Go to dashboard"
          >
            <HomeIcon className="h-5 w-5 mr-2" />
            Go to Dashboard
          </button>
        </div>

        {/* Subtle Footer Text */}
        <p className="mt-12 text-sm text-gray-400">
          Need help? Contact{" "}
          <a
            href="mailto:support@digititan.com"
            className="text-indigo-600 hover:text-indigo-500 font-medium underline transition"
          >
            support@digititan.com
          </a>
        </p>
      </div>

      {/* Floating Decorative Elements */}
      <div className="absolute top-10 left-10 w-2 h-2 bg-indigo-200 rounded-full animate-bounce"></div>
      <div className="absolute bottom-20 right-20 w-1 h-1 bg-purple-200 rounded-full animate-pulse"></div>
      <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-blue-100 rounded-full animate-bounce delay-1000"></div>
    </div>
  );
};

export default NotFoundPage;