import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  HomeIcon,
  ArrowPathIcon,
  CloudIcon,
} from "@heroicons/react/24/outline";

const NotFoundPage = () => {
  const navigate = useNavigate();
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Trigger animations after component mounts
    setIsAnimating(true);
  }, []);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate("/dashboard", { replace: true });
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8 overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-indigo-200 rounded-full opacity-70"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `float ${
                6 + Math.random() * 10
              }s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          ></div>
        ))}
      </div>

      {/* Main content container */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-lg mx-auto">
        {/* Animated SVG Illustration */}
        <div className="relative w-56 h-56 mb-8">
          <div
            className={`relative w-full h-full transition-all duration-1000 ${
              isAnimating ? "scale-100 opacity-100" : "scale-75 opacity-0"
            }`}
          >
            <svg
              viewBox="0 0 200 200"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full"
            >
              {/* Background Circle */}
              <circle cx="100" cy="100" r="90" fill="#f3f4f6" />

              {/* Animated outer circle */}
              <circle
                cx="100"
                cy="100"
                r="95"
                fill="none"
                stroke="#818cf8"
                strokeWidth="2"
                strokeDasharray="5,5"
                className="animate-spin-slow"
                style={{ transformOrigin: "center" }}
              />

              {/* Warning Triangle */}
              <path
                d="M90,50 L110,50 L100,120 Z"
                fill="#ef4444"
                stroke="#dc2626"
                strokeWidth="3"
                className={`transition-all duration-1000 ${
                  isAnimating ? "scale-100 opacity-100" : "scale-0 opacity-0"
                }`}
              />

              {/* Exclamation mark */}
              <path
                d="M100,70 L100,85 M100,95 L100,100"
                stroke="#ffffff"
                strokeWidth="3"
                strokeLinecap="round"
                className={`transition-all duration-1000 delay-300 ${
                  isAnimating ? "scale-100 opacity-100" : "scale-0 opacity-0"
                }`}
              />
            </svg>

            {/* Floating 404 text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-9xl font-black text-gray-800 opacity-10 select-none">
                404
              </span>
            </div>
          </div>
        </div>

        {/* Text content */}
        <div
          className={`space-y-4 transition-all duration-700 delay-300 ${
            isAnimating
              ? "translate-y-0 opacity-100"
              : "translate-y-4 opacity-0"
          }`}
        >
          <h1 className="text-6xl md:text-7xl font-extrabold text-gray-800 tracking-tight">
            404
          </h1>
          <h2 className="text-2xl font-bold text-gray-800">Page Not Found</h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            Oops! The page you're looking for seems to have wandered off into
            the digital void. Let's get you back on track.
          </p>
        </div>

        {/* Action Buttons */}
        <div
          className={`mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center transition-all duration-700 delay-500 ${
            isAnimating
              ? "translate-y-0 opacity-100"
              : "translate-y-4 opacity-0"
          }`}
        >
          <button
            onClick={handleGoBack}
            className="group inline-flex items-center justify-center px-5 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
            aria-label="Go back to previous page"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Go Back
          </button>

          <button
            onClick={handleRefresh}
            className="group inline-flex items-center justify-center px-5 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
            aria-label="Refresh page"
          >
            <ArrowPathIcon className="h-5 w-5 mr-2 group-hover:rotate-180 transition-transform" />
            Refresh
          </button>

          <button
            onClick={handleGoHome}
            className="group inline-flex items-center justify-center px-5 py-3 bg-indigo-600 text-white font-medium rounded-lg shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
            aria-label="Go to dashboard"
          >
            <HomeIcon className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
            Go to Dashboard
          </button>
        </div>

        {/* Additional help section */}
        <div
          className={`mt-12 p-4 bg-indigo-50 rounded-lg transition-all duration-700 delay-700 ${
            isAnimating
              ? "translate-y-0 opacity-100"
              : "translate-y-4 opacity-0"
          }`}
        >
          <div className="flex items-start">
            <CloudIcon className="h-6 w-6 text-indigo-500 mr-3 flex-shrink-0" />
            <div className="text-left">
              <h3 className="font-medium text-indigo-800">Need assistance?</h3>
              <p className="text-sm text-indigo-600 mt-1">
                Contact our support team at{" "}
                <a
                  href="mailto:support@digititan.com"
                  className="font-medium underline hover:text-indigo-500 transition-colors"
                >
                  support@digititan.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0) translateX(0); }
            25% { transform: translateY(-20px) translateX(10px); }
            50% { transform: translateY(-10px) translateX(20px); }
            75% { transform: translateY(0px) translateX(10px); }
          }
          
          .animate-spin-slow {
            animation: spin 15s linear infinite;
          }
          
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default NotFoundPage;
