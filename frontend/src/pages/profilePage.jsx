import React, { useState, useEffect } from "react";
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  CalendarIcon,
  PencilIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowLeftIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../contexts/AuthContext";
import { ApiService, useApiInterceptors } from "../api/web-api-service";

const ProfilePage = () => {
  const { user, updateUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [updatePassword, setUpdatePassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    department: "",
    position: "",
    joinDate: "",
    avatar: "",
    password: "",
    confirmPassword: "",
  });
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestType, setRequestType] = useState(""); // 'department' or 'position'
  const [requestDetails, setRequestDetails] = useState("");

  // Initialize interceptors
  useApiInterceptors();

  // Initialize form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        phone: user.phone || "",
        department: user.department || "",
        position: user.position || "",
        joinDate: user.joinDate || "",
        avatar: user.avatar || "",
        password: "",
        confirmPassword: "",
      });
    }
  }, [user]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear errors when user types
    if (errorMessage) {
      setErrorMessage("");
    }
  };

  // Handle checkbox change for password update
  const handlePasswordCheckboxChange = (e) => {
    setUpdatePassword(e.target.checked);
    if (!e.target.checked) {
      setFormData({
        ...formData,
        password: "",
        confirmPassword: "",
      });
    }
  };

  // Validate password fields
  const validatePasswords = () => {
    if (updatePassword) {
      if (!formData.password) {
        setErrorMessage("Password is required when updating password");
        return false;
      }
      if (formData.password.length < 8) {
        setErrorMessage("Password must be at least 8 characters long");
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setErrorMessage("Passwords do not match");
        return false;
      }
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    // Validate passwords if updating
    if (!validatePasswords()) {
      setLoading(false);
      return;
    }

    try {
      // Prepare profile updates
      const profileUpdates = {
        name: formData.name,
        phone: formData.phone,
        // DO NOT include department, position, or role - these are admin-only
        joinDate: formData.joinDate,
        avatar: formData.avatar,
      };

      // Add password if updating
      if (updatePassword && formData.password) {
        profileUpdates.password = formData.password;
      }

      // Use ApiService for the PUT request
      const response = await ApiService.put(
        `/users/${user.id}`,
        profileUpdates
      );

      // Update the auth context with new user data
      await updateUserProfile(user?.id, response.data);

      setSuccessMessage(
        updatePassword
          ? "Your profile and password have been updated successfully!"
          : "Your profile has been updated successfully!"
      );
      setIsEditing(false);
      setUpdatePassword(false);
      setFormData({
        ...formData,
        password: "",
        confirmPassword: "",
      });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setErrorMessage(
        error.response?.data?.message ||
          "Failed to update profile. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Reset form to current user data
  const handleReset = () => {
    setFormData({
      name: user.name || "",
      phone: user.phone || "",
      department: user.department || "",
      position: user.position || "",
      joinDate: user.joinDate || "",
      avatar: user.avatar || "",
      password: "",
      confirmPassword: "",
    });
    setIsEditing(false);
    setUpdatePassword(false);
    setErrorMessage("");
    setSuccessMessage("");
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Get department color based on department name
  const getDepartmentColor = (department) => {
    const colors = {
      Engineering: "bg-blue-100 text-blue-800",
      Marketing: "bg-purple-100 text-purple-800",
      Sales: "bg-green-100 text-green-800",
      HR: "bg-pink-100 text-pink-800",
      Finance: "bg-indigo-100 text-indigo-800",
      Operations: "bg-orange-100 text-orange-800",
      IT: "bg-gray-100 text-gray-800",
      "Customer Support": "bg-teal-100 text-teal-800",
    };
    return colors[department] || "bg-gray-100 text-gray-800";
  };

  // Calculate total leave balance
  const calculateTotalLeaveBalance = (leaveBalances) => {
    if (!leaveBalances) return 0;
    return Object.values(leaveBalances).reduce(
      (sum, balance) => sum + (balance || 0),
      0
    );
  };

  // Format leave type for display
  const formatLeaveType = (leaveType) => {
    return leaveType
      .replace(/([A-Z])/g, " $1")
      .trim()
      .replace(/^./, (str) => str.toUpperCase());
  };

  // Handle request for department/position update
  const handleRequestUpdate = (type) => {
    setRequestType(type);
    setRequestDetails("");
    setShowRequestModal(true);
  };

  // Submit request for update
  const submitUpdateRequest = async () => {
    if (!requestDetails.trim()) {
      alert("Please provide details for your request.");
      return;
    }

    try {
      // In a real app, you would send this to an API endpoint
      // For now, we'll just simulate it
      console.log(`Update Request: ${requestType}`, requestDetails);
      alert(
        `Your request to update your ${requestType} has been submitted to HR. They will review it and get back to you soon.`
      );
      setShowRequestModal(false);
    } catch (error) {
      console.error("Error submitting request:", error);
      alert("Failed to submit request. Please try again later.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <div className="mb-8">
        <a
          href="/dashboard/leave"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Dashboard
        </a>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">My Profile</h1>
        <p className="mt-2 text-xl text-gray-600">
          Manage your personal information and view your employment details
        </p>
      </div>

      {/* Profile Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Profile Section */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-200">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-black bg-opacity-10"></div>
              <div className="relative z-10">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                  <div className="relative">
                    {formData.avatar ? (
                      <img
                        src={formData.avatar}
                        alt={formData.name}
                        className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-2xl transition-transform duration-300 hover:scale-105"
                        onError={(e) => {
                          e.target.src =
                            "https://via.placeholder.com/150?text=User";
                        }}
                      />
                    ) : (
                      <div className="h-32 w-32 rounded-full bg-white bg-opacity-20 flex items-center justify-center backdrop-blur-sm">
                        <UserIcon className="h-16 w-16" />
                      </div>
                    )}
                    {isEditing && (
                      <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-lg border-2 border-gray-100">
                        <PencilIcon className="h-5 w-5 text-gray-700" />
                      </div>
                    )}
                  </div>

                  <div className="text-center md:text-left flex-1">
                    <h2 className="text-3xl font-bold mb-2">
                      {formData.name || "User Name"}
                    </h2>
                    <p className="text-indigo-100 text-lg mb-4">
                      {user?.email || "Email not available"}
                    </p>

                    {user?.role && (
                      <div className="inline-flex items-center space-x-2 mb-6">
                        <span
                          className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                            user.role === "admin"
                              ? "bg-yellow-500 text-white"
                              : user.role === "manager"
                              ? "bg-purple-500 text-white"
                              : "bg-blue-500 text-white"
                          }`}
                        >
                          {user.role.charAt(0).toUpperCase() +
                            user.role.slice(1)}
                        </span>
                        <span className="text-indigo-100 text-sm">
                          • {formatDate(formData.joinDate)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="md:ml-auto">
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="inline-flex items-center px-6 py-3 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-lg hover:bg-opacity-30 transition-all duration-200 font-medium transform hover:scale-105 hover:shadow-lg"
                      >
                        <PencilIcon className="h-5 w-5 mr-2" />
                        Edit Profile
                      </button>
                    ) : (
                      <div className="flex space-x-3">
                        <button
                          onClick={handleReset}
                          className="px-6 py-3 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-lg hover:bg-opacity-30 transition-all duration-200 font-medium hover:scale-105"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSubmit}
                          disabled={loading}
                          className="px-6 py-3 bg-white text-indigo-600 rounded-lg hover:bg-gray-100 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 hover:shadow-lg"
                        >
                          {loading ? (
                            <div className="flex items-center">
                              <svg
                                className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-600"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
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
                              Saving...
                            </div>
                          ) : (
                            "Save Changes"
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column - Personal Information */}
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                    <UserIcon className="h-6 w-6 mr-3 text-indigo-600" />
                    Personal Information
                  </h3>

                  <div className="space-y-6">
                    <div className="flex items-start group">
                      <div className="flex-shrink-0 h-12 w-12 bg-indigo-100 rounded-xl flex items-center justify-center group-hover:bg-indigo-200 transition-colors duration-200">
                        <UserIcon className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div className="ml-4 flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm"
                            placeholder="Enter your full name"
                            autoFocus
                          />
                        ) : (
                          <p className="text-gray-900 text-lg font-medium">
                            {formData.name || "Not provided"}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start group">
                      <div className="flex-shrink-0 h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-200">
                        <EnvelopeIcon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address
                        </label>
                        <p className="text-gray-900 text-lg font-medium">
                          {user?.email || "Email not available"}
                        </p>
                        <p className="text-sm text-gray-500 mt-1 italic">
                          This cannot be changed
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start group">
                      <div className="flex-shrink-0 h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors duration-200">
                        <PhoneIcon className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="ml-4 flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number
                        </label>
                        {isEditing ? (
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm"
                            placeholder="Enter your phone number"
                          />
                        ) : (
                          <p className="text-gray-900 text-lg font-medium">
                            {formData.phone || "Not provided"}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Password Update Section */}
                    {isEditing && (
                      <div className="border-t border-gray-200 pt-6">
                        <div className="flex items-center mb-4">
                          <input
                            type="checkbox"
                            id="updatePassword"
                            checked={updatePassword}
                            onChange={handlePasswordCheckboxChange}
                            className="h-5 w-5 text-indigo-600 focus:ring-2 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor="updatePassword"
                            className="ml-3 block text-lg font-medium text-gray-700"
                          >
                            Update Password
                          </label>
                        </div>

                        {updatePassword && (
                          <div className="space-y-4">
                            <div className="flex items-start group">
                              <div className="flex-shrink-0 h-12 w-12 bg-red-100 rounded-xl flex items-center justify-center group-hover:bg-red-200 transition-colors duration-200">
                                <LockClosedIcon className="h-6 w-6 text-red-600" />
                              </div>
                              <div className="ml-4 flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  New Password
                                </label>
                                <div className="relative">
                                  <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm"
                                    placeholder="Enter new password (min 8 characters)"
                                  />
                                  <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                                    onClick={() =>
                                      setShowPassword(!showPassword)
                                    }
                                  >
                                    {showPassword ? (
                                      <EyeSlashIcon className="h-5 w-5" />
                                    ) : (
                                      <EyeIcon className="h-5 w-5" />
                                    )}
                                  </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                  Password must be at least 8 characters long
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start group">
                              <div className="flex-shrink-0 h-12 w-12 bg-red-100 rounded-xl flex items-center justify-center group-hover:bg-red-200 transition-colors duration-200">
                                <LockClosedIcon className="h-6 w-6 text-red-600" />
                              </div>
                              <div className="ml-4 flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Confirm New Password
                                </label>
                                <div className="relative">
                                  <input
                                    type={
                                      showConfirmPassword ? "text" : "password"
                                    }
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm"
                                    placeholder="Confirm new password"
                                  />
                                  <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                                    onClick={() =>
                                      setShowConfirmPassword(
                                        !showConfirmPassword
                                      )
                                    }
                                  >
                                    {showConfirmPassword ? (
                                      <EyeSlashIcon className="h-5 w-5" />
                                    ) : (
                                      <EyeIcon className="h-5 w-5" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column - Employment Details */}
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                    <BuildingOfficeIcon className="h-6 w-6 mr-3 text-indigo-600" />
                    Employment Details
                  </h3>

                  <div className="space-y-6">
                    <div className="flex items-start group">
                      <div className="flex-shrink-0 h-12 w-12 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-gray-200 transition-colors duration-200">
                        <CalendarIcon className="h-6 w-6 text-gray-600" />
                      </div>
                      <div className="ml-4 flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Join Date
                        </label>
                        {isEditing ? (
                          <input
                            type="date"
                            name="joinDate"
                            value={formData.joinDate}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm"
                          />
                        ) : (
                          <p className="text-gray-900 text-lg font-medium">
                            {formatDate(formData.joinDate)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start group">
                      <div className="flex-shrink-0 h-12 w-12 bg-yellow-100 rounded-xl flex items-center justify-center group-hover:bg-yellow-200 transition-colors duration-200">
                        <ShieldCheckIcon className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div className="ml-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status
                        </label>
                        <span className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          <CheckCircleIcon className="h-4 w-4 mr-2" />
                          Active
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start group">
                      <div className="flex-shrink-0 h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors duration-200">
                        <BuildingOfficeIcon className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="ml-4 flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                          Department
                          <span className="ml-2">
                            <LockClosedIcon className="h-4 w-4 text-gray-400" />
                          </span>
                        </label>
                        {isEditing ? (
                          <div className="relative">
                            <input
                              type="text"
                              name="department"
                              value={formData.department}
                              readOnly
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                            />
                            <button
                              type="button"
                              onClick={() => handleRequestUpdate("department")}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded hover:bg-indigo-100 transition-colors duration-200"
                            >
                              Request Update
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <span
                              className={`px-4 py-2 rounded-full text-sm font-medium ${getDepartmentColor(
                                formData.department
                              )}`}
                            >
                              {formData.department || "Not specified"}
                            </span>
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-2 flex items-center">
                          <InformationCircleIcon className="h-4 w-4 mr-1" />
                          Contact HR to update your department
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start group">
                      <div className="flex-shrink-0 h-12 w-12 bg-orange-100 rounded-xl flex items-center justify-center group-hover:bg-orange-200 transition-colors duration-200">
                        <BriefcaseIcon className="h-6 w-6 text-orange-600" />
                      </div>
                      <div className="ml-4 flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                          Position
                          <span className="ml-2">
                            <LockClosedIcon className="h-4 w-4 text-gray-400" />
                          </span>
                        </label>
                        {isEditing ? (
                          <div className="relative">
                            <input
                              type="text"
                              name="position"
                              value={formData.position}
                              readOnly
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                            />
                            <button
                              type="button"
                              onClick={() => handleRequestUpdate("position")}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded hover:bg-indigo-100 transition-colors duration-200"
                            >
                              Request Update
                            </button>
                          </div>
                        ) : (
                          <p className="text-gray-900 text-lg font-medium">
                            {formData.position || "Not specified"}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-2 flex items-center">
                          <InformationCircleIcon className="h-4 w-4 mr-1" />
                          Contact HR for position updates
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start group">
                      <div className="flex-shrink-0 h-12 w-12 bg-indigo-100 rounded-xl flex items-center justify-center group-hover:bg-indigo-200 transition-colors duration-200">
                        <SparklesIcon className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div className="ml-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                          Role
                          <span className="ml-2">
                            <LockClosedIcon className="h-4 w-4 text-gray-400" />
                          </span>
                        </label>
                        <p className="text-gray-900 text-lg font-medium">
                          {user?.role === "admin"
                            ? "Administrator"
                            : user?.role === "manager"
                            ? "Manager"
                            : user?.role === "employee"
                            ? "Employee"
                            : "User"}
                        </p>
                        <p className="text-xs text-gray-500 mt-2 flex items-center">
                          <InformationCircleIcon className="h-4 w-4 mr-1" />
                          Assigned by system administrator
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start group">
                      <div className="flex-shrink-0 h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-200">
                        <PencilIcon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-4 flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Avatar
                        </label>
                        {isEditing ? (
                          <input
                            type="url"
                            name="avatar"
                            value={formData.avatar}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm"
                            placeholder="https://example.com/avatar.jpg"
                          />
                        ) : (
                          <div className="flex items-center">
                            {formData.avatar ? (
                              <img
                                src={formData.avatar}
                                alt={formData.name}
                                className="h-12 w-12 rounded-full object-cover mr-3 border-2 border-gray-200"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center mr-3 border-2 border-gray-200">
                                <UserIcon className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <p className="text-gray-900 font-medium">
                                {formData.avatar
                                  ? "Custom avatar"
                                  : "Default avatar"}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {isEditing
                                  ? "Provide a URL to an image for your profile picture"
                                  : "Upload a custom avatar in edit mode"}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Success/Error Messages */}
              {successMessage && (
                <div className="mt-8 p-5 bg-green-50 border border-green-200 rounded-xl animate-fade-in">
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-6 w-6 text-green-500 mr-3" />
                    <p className="text-green-800 text-base font-medium">
                      {successMessage}
                    </p>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="mt-8 p-5 bg-red-50 border border-red-200 rounded-xl animate-fade-in">
                  <div className="flex items-center">
                    <XMarkIcon className="h-6 w-6 text-red-500 mr-3" />
                    <p className="text-red-800 text-base font-medium">
                      {errorMessage}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Leave Balance Section */}
        <div className="space-y-6">
          {/* Leave Balance Card */}
          <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-200">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
              <div className="flex items-center">
                <ChartBarIcon className="h-7 w-7 mr-3" />
                <h3 className="text-2xl font-bold">Leave Balances</h3>
              </div>
            </div>
            <div className="p-6">
              {user?.leaveBalances ? (
                <div className="space-y-6">
                  {/* Total Balance */}
                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-100">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-lg font-medium text-gray-700">
                        Total Available Days
                      </span>
                      <span className="text-3xl font-bold text-indigo-600">
                        {calculateTotalLeaveBalance(user.leaveBalances)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="h-3 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500"
                        style={{
                          width: `${Math.min(
                            (calculateTotalLeaveBalance(user.leaveBalances) /
                              30) *
                              100,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      {calculateTotalLeaveBalance(user.leaveBalances) > 20
                        ? "Excellent balance!"
                        : calculateTotalLeaveBalance(user.leaveBalances) > 10
                        ? "Good balance"
                        : "Consider planning your time off"}
                    </p>
                  </div>

                  {/* Individual Leave Types */}
                  {Object.entries(user.leaveBalances).map(
                    ([leaveType, balance]) => (
                      <div
                        key={leaveType}
                        className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all duration-300 group"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900 text-lg">
                              {formatLeaveType(leaveType)}
                            </h4>
                            <p className="text-sm text-gray-500 mt-1">
                              {balance} day{balance !== 1 ? "s" : ""} remaining
                            </p>
                          </div>
                          <div
                            className={`px-4 py-2 rounded-full text-sm font-medium ${
                              balance > 5
                                ? "bg-green-100 text-green-800"
                                : balance > 0
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {balance} days
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full transition-all duration-500 ease-out ${
                              balance > 5
                                ? "bg-green-500"
                                : balance > 0
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{
                              width: `${Math.min((balance / 15) * 100, 100)}%`,
                            }}
                          ></div>
                        </div>

                        {/* Usage tip */}
                        {balance === 0 && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-xs text-red-700 font-medium flex items-center">
                              <InformationCircleIcon className="h-4 w-4 mr-2" />
                              Contact HR to request additional{" "}
                              {formatLeaveType(leaveType)} days
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto h-16 w-16 text-gray-300 mb-4">
                    <ChartBarIcon className="h-16 w-16" />
                  </div>
                  <p className="text-gray-500 text-lg">
                    No leave balance information available
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Contact HR for assistance
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Request Update Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Request{" "}
                  {requestType === "department" ? "Department" : "Position"}{" "}
                  Update
                </h3>
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Please provide details about your request to update your{" "}
                  {requestType}. Our HR team will review your request and get
                  back to you within 3-5 business days.
                </p>
                <textarea
                  value={requestDetails}
                  onChange={(e) => setRequestDetails(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm"
                  rows="4"
                  placeholder={`Why do you want to change your ${requestType}? Please provide details...`}
                />
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
                >
                  Cancel
                </button>
                <button
                  onClick={submitUpdateRequest}
                  className="px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
                >
                  Submit Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
