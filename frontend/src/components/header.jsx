// src/components/Header.jsx
import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import digititanLogo from "../assets/digititan-logo.jpeg";

const Header = ({ variant = "default" }) => {
  const { isLoggedIn, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header
      className={`w-full ${
        variant === "auth"
          ? "bg-white shadow-sm border-b border-gray-100"
          : "bg-white shadow-md"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 shadow-lg">
              <img
                src={digititanLogo}
                alt="Digititan Logo"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Digititan</h1>
              <p className="text-xs text-gray-500 -mt-1">Leave Management</p>
            </div>
          </div>

          {/* Navigation for logged in users */}
          {isLoggedIn && variant !== "auth" && (
            <nav className="hidden md:flex items-center space-x-8">
              <Link
                to="/dashboard"
                className="text-gray-700 hover:text-indigo-600 transition-colors duration-200"
              >
                Dashboard
              </Link>
              <Link
                to="/leaves"
                className="text-gray-700 hover:text-indigo-600 transition-colors duration-200"
              >
                My Leaves
              </Link>
              <Link
                to="/calendar"
                className="text-gray-700 hover:text-indigo-600 transition-colors duration-200"
              >
                Calendar
              </Link>

              {/* Profile Dropdown */}
              <div className="flex items-center space-x-3 relative">
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-5 5v-5zM9 7H4l5-5v5zM12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"
                    />
                  </svg>
                </button>
                <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {user?.name
                    ? user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                    : "JD"}
                </div>

                {/* Dropdown menu */}
                <div className="absolute right-0 mt-12 w-48 bg-white border border-gray-200 shadow-lg rounded-lg py-2 z-50 hidden group-hover:block">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </nav>
          )}

          {/* Auth variant or logged out */}
          {(!isLoggedIn || variant === "auth") && (
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              {!isLoggedIn && (
                <>
                  <Link
                    to="/login"
                    className="text-indigo-600 hover:text-indigo-500 font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="text-indigo-600 hover:text-indigo-500 font-medium"
                  >
                    Request Access
                  </Link>
                </>
              )}
              {variant === "auth" && (
                <>
                  Need help?{" "}
                  <Link
                    to="/support"
                    className="ml-1 text-indigo-600 hover:text-indigo-500"
                  >
                    Contact Support
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
