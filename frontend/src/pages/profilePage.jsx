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
} from "@heroicons/react/24/outline";

import { useAuth } from "../contexts/AuthContext";

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
        department: formData.department,
        position: formData.position,
        joinDate: formData.joinDate,
        avatar: formData.avatar,
      };

      // Add password if updating
      if (updatePassword && formData.password) {
        profileUpdates.password = formData.password;
      }

      // Call the correct API endpoint
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `http://localhost:5000/api/users/${user.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(profileUpdates),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }

      const updatedUser = await response.json();

      // Update the auth context with new user data
      await updateUserProfile(user?.id, updatedUser);

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
        error.message || "Failed to update profile. Please try again."
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <a
          href="/"
          className="inline-flex items-center text-indigo-600 hover:text-indigo-500 transition-colors duration-200"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-1" />
          Back to Dashboard
        </a>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="mt-2 text-gray-600">
          Manage your personal information and preferences
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-8 text-white">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="relative">
              {formData.avatar ? (
                <img
                  src={formData.avatar}
                  alt={formData.name}
                  className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                  <UserIcon className="h-12 w-12" />
                </div>
              )}
              {isEditing && (
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-lg">
                  <PencilIcon className="h-5 w-5 text-gray-600" />
                </div>
              )}
            </div>

            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold">
                {formData.name || "User Name"}
              </h2>
              <p className="text-indigo-100 mt-1">
                {user?.email || "Email not available"}
              </p>

              {user?.role && (
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${
                    user.role === "admin"
                      ? "bg-yellow-100 text-yellow-800"
                      : user.role === "manager"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
              )}
            </div>

            <div className="md:ml-auto">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-lg hover:bg-opacity-30 transition-all duration-200 font-medium"
                >
                  <PencilIcon className="h-5 w-5 mr-2" />
                  Edit Profile
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-lg hover:bg-opacity-30 transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-gray-100 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Personal Information
              </h3>

              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <UserIcon className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="ml-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter your full name"
                        autoFocus
                      />
                    ) : (
                      <p className="text-gray-900">
                        {formData.name || "Not provided"}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <EnvelopeIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <p className="text-gray-900">
                      {user?.email || "Email not available"}
                    </p>
                    <p className="text-sm text-gray-500 mt-1 italic">
                      This cannot be changed
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <PhoneIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter your phone number"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {formData.phone || "Not provided"}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <BuildingOfficeIcon className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    {isEditing ? (
                      <select
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">Select Department</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Sales">Sales</option>
                        <option value="HR">HR</option>
                        <option value="Finance">Finance</option>
                        <option value="Operations">Operations</option>
                        <option value="IT">IT</option>
                        <option value="Customer Support">
                          Customer Support
                        </option>
                      </select>
                    ) : (
                      <div className="flex items-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getDepartmentColor(
                            formData.department
                          )}`}
                        >
                          {formData.department || "Not specified"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <BriefcaseIcon className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Position
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="position"
                        value={formData.position}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter your position"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {formData.position || "Not specified"}
                      </p>
                    )}
                  </div>
                </div>

                {/* Password Update Section */}
                {isEditing && (
                  <div className="border-t pt-6">
                    <div className="flex items-center mb-4">
                      <input
                        type="checkbox"
                        id="updatePassword"
                        checked={updatePassword}
                        onChange={handlePasswordCheckboxChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="updatePassword"
                        className="ml-2 block text-sm font-medium text-gray-700"
                      >
                        Update Password
                      </label>
                    </div>

                    {updatePassword && (
                      <div className="space-y-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <LockClosedIcon className="h-5 w-5 text-red-600" />
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
                                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Enter new password (min 8 characters)"
                              />
                              <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                                ) : (
                                  <EyeIcon className="h-5 w-5 text-gray-400" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <div className="flex-shrink-0 h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <LockClosedIcon className="h-5 w-5 text-red-600" />
                          </div>
                          <div className="ml-4 flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Confirm New Password
                            </label>
                            <div className="relative">
                              <input
                                type={showConfirmPassword ? "text" : "password"}
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Confirm new password"
                              />
                              <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                onClick={() =>
                                  setShowConfirmPassword(!showConfirmPassword)
                                }
                              >
                                {showConfirmPassword ? (
                                  <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                                ) : (
                                  <EyeIcon className="h-5 w-5 text-gray-400" />
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

            {/* Right Column */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Employment Details
              </h3>

              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <CalendarIcon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="ml-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Join Date
                    </label>
                    {isEditing ? (
                      <input
                        type="date"
                        name="joinDate"
                        value={formData.joinDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {formatDate(formData.joinDate)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <UserIcon className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <p className="text-gray-900">
                      {user?.role === "admin"
                        ? "Administrator"
                        : user?.role === "manager"
                        ? "Manager"
                        : user?.role === "employee"
                        ? "Employee"
                        : "User"}
                    </p>
                    <p className="text-sm text-gray-500 mt-1 italic">
                      This is assigned by system
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BuildingOfficeIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      Active
                    </span>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <PencilIcon className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="ml-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Avatar
                    </label>
                    {isEditing ? (
                      <input
                        type="url"
                        name="avatar"
                        value={formData.avatar}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="https://example.com/avatar.jpg"
                      />
                    ) : (
                      <div className="flex items-center">
                        {formData.avatar ? (
                          <img
                            src={formData.avatar}
                            alt={formData.name}
                            className="h-8 w-8 rounded-full object-cover mr-2"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                            <UserIcon className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <p className="text-gray-900">
                          {formData.avatar ? "Custom avatar" : "Default avatar"}
                        </p>
                      </div>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      {isEditing
                        ? "Provide a URL to an image for your profile picture"
                        : "Upload a custom avatar in the edit mode"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Success/Error Messages */}
          {successMessage && (
            <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                <p className="text-green-800 text-sm">{successMessage}</p>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <XMarkIcon className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-red-800 text-sm">{errorMessage}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
