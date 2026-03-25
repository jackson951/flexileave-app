import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Helmet } from "react-helmet-async";

const slugify = (value) =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

const TenantRegister = () => {
  const { registerTenant } = useAuth();
  const navigate = useNavigate();

  const colorOptions = [
    { value: "#4f46e5", label: "Indigo", description: "Modern indigo" },
    { value: "#0ea5e9", label: "Sky Blue", description: "Fresh tech blue" },
    { value: "#059669", label: "Emerald", description: "Vibrant green" },
    { value: "#f97316", label: "Amber", description: "Warm amber" },
    { value: "#f43f5e", label: "Rose", description: "Bold rose" },
    { value: "#6366f1", label: "Violet", description: "Soft violet" },
    { value: "#14b8a6", label: "Teal", description: "Cool teal" },
  ];

  const accentOptions = [
    { value: "#7c3aed", label: "Purple", description: "Royal purple" },
    { value: "#1d4ed8", label: "Blue", description: "Primary blue" },
    { value: "#ec4899", label: "Pink", description: "Playful pink" },
    { value: "#0f766e", label: "Emphasis Teal", description: "Deep teal" },
    { value: "#e11d48", label: "Crimson", description: "Bold crimson" },
    { value: "#8b5cf6", label: "Amethyst", description: "Violet sparkle" },
    { value: "#f59e0b", label: "Sunset", description: "Sunset amber" },
  ];

  const [formData, setFormData] = useState({
    tenantName: "",
    tenantSlug: "",
    ownerName: "",
    ownerEmail: "",
    ownerPassword: "",
    primaryColor: "#4f46e5", // Default indigo-500
    secondaryColor: "#7c3aed", // Default purple-600
  });
  const [logoFile, setLogoFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [primarySearch, setPrimarySearch] = useState("");
  const [secondarySearch, setSecondarySearch] = useState("");
  const [primaryDropdownOpen, setPrimaryDropdownOpen] = useState(false);
  const [secondaryDropdownOpen, setSecondaryDropdownOpen] = useState(false);
  const primaryRef = useRef();
  const secondaryRef = useRef();

  const validate = () => {
    const validation = {};
    if (!formData.tenantName.trim())
      validation.tenantName = "Organization name is required";
    if (!formData.ownerName.trim())
      validation.ownerName = "Owner name is required";
    if (!formData.ownerEmail.trim())
      validation.ownerEmail = "Owner email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.ownerEmail))
      validation.ownerEmail = "Please provide a valid email";
    if (!formData.ownerPassword)
      validation.ownerPassword = "Password is required";
    else if (formData.ownerPassword.length < 8)
      validation.ownerPassword = "Password must be at least 8 characters";
    if (!formData.tenantSlug.trim())
      validation.tenantSlug = "Tenant slug cannot be empty";
    
    // Validate colors
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (formData.primaryColor && !colorRegex.test(formData.primaryColor))
      validation.primaryColor = "Invalid primary color format";
    if (formData.secondaryColor && !colorRegex.test(formData.secondaryColor))
      validation.secondaryColor = "Invalid secondary color format";
    
    setErrors(validation);
    return Object.keys(validation).length === 0;
  };

  const updateColor = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === "primaryColor" || name === "secondaryColor") {
      updateColor(name, value);
      return;
    }
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "tenantName" && !prev.tenantSlug) {
        next.tenantSlug = slugify(value);
      }
      return next;
    });
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (primaryRef.current && !primaryRef.current.contains(event.target)) {
        setPrimaryDropdownOpen(false);
      }
      if (secondaryRef.current && !secondaryRef.current.contains(event.target)) {
        setSecondaryDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredPrimaryOptions = colorOptions.filter((option) =>
    `${option.label} ${option.description}`.toLowerCase().includes(primarySearch.toLowerCase())
  );

  const filteredSecondaryOptions = accentOptions.filter((option) =>
    `${option.label} ${option.description}`.toLowerCase().includes(secondarySearch.toLowerCase())
  );

  const handleLogoChange = (event) => {
    setLogoFile(event.target.files[0]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    setSuccess("");
    
    try {
      const formDataToSend = new FormData();
      
      // Add all form fields
      formDataToSend.append('tenantName', formData.tenantName);
      formDataToSend.append('tenantSlug', formData.tenantSlug);
      formDataToSend.append('ownerName', formData.ownerName);
      formDataToSend.append('ownerEmail', formData.ownerEmail);
      formDataToSend.append('ownerPassword', formData.ownerPassword);
      formDataToSend.append('primaryColor', formData.primaryColor);
      formDataToSend.append('secondaryColor', formData.secondaryColor);
      
      // Add logo file if selected
      if (logoFile) {
        formDataToSend.append('logo', logoFile);
      }

      await registerTenant(formDataToSend);
      setSuccess("Tenant registered successfully. Redirecting...");
      setTimeout(() => navigate("/dashboard/leave"), 1200);
    } catch (error) {
      setErrors({ submit: error.response?.data?.message || "Registration failed" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Register Your Organization | FlexiLeave</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="w-full max-w-4xl rounded-3xl border bg-white/90 p-8 shadow-xl">
            <div className="mb-6 text-center">
              <h1 className="text-3xl font-semibold text-gray-900">
                Start your organization
              </h1>
              <p className="text-gray-500">
                Register your company and create the first admin account with custom branding.
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Company Information */}
              <div className="grid gap-4 lg:grid-cols-2">
                <label className="flex flex-col text-sm font-semibold text-gray-700">
                  Organization name
                  <input
                    name="tenantName"
                    value={formData.tenantName}
                    onChange={handleChange}
                    className="mt-1 rounded-xl border px-3 py-2 focus:border-indigo-500 focus:outline-none"
                  />
                  {errors.tenantName && (
                    <span className="text-xs text-red-600">{errors.tenantName}</span>
                  )}
                </label>
                <label className="flex flex-col text-sm font-semibold text-gray-700">
                  Tenant slug
                  <input
                    name="tenantSlug"
                    value={formData.tenantSlug}
                    onChange={handleChange}
                    className="mt-1 rounded-xl border px-3 py-2 focus:border-indigo-500 focus:outline-none"
                    placeholder="company-name"
                  />
                  {errors.tenantSlug && (
                    <span className="text-xs text-red-600">{errors.tenantSlug}</span>
                  )}
                </label>
              </div>

              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Company Logo (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="w-full rounded-xl border px-3 py-2 focus:border-indigo-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: JPG, PNG, GIF, WebP. Max size: 5MB.
                </p>
              </div>

              {/* Color Settings */}
              <div className="grid gap-6 lg:grid-cols-2">
                <div ref={primaryRef}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Primary Color
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={primarySearch}
                      onChange={(event) => {
                        setPrimarySearch(event.target.value);
                        setPrimaryDropdownOpen(true);
                      }}
                      onFocus={() => setPrimaryDropdownOpen(true)}
                      placeholder="Search or pick a color"
                      className="w-full rounded-xl border px-3 py-2 focus:border-indigo-500 focus:outline-none"
                    />
                    <div
                      className={`absolute z-10 mt-1 w-full rounded-xl border bg-white shadow-lg dark:bg-gray-900 dark:border-gray-700 ${
                        primaryDropdownOpen ? "block" : "hidden"
                      }`}
                    >
                      {filteredPrimaryOptions.length > 0 ? (
                        filteredPrimaryOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              updateColor("primaryColor", option.value);
                              setPrimaryDropdownOpen(false);
                            }}
                            className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-gray-700 hover:bg-indigo-50 dark:text-gray-200 dark:hover:bg-indigo-600"
                          >
                            <span
                              className="h-6 w-6 rounded-full border border-gray-300"
                              style={{ backgroundColor: option.value }}
                            />
                            <div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-300">
                                {option.description}
                              </div>
                            </div>
                            <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                              {option.value}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                          No colors match your search.
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div
                      className="h-12 w-12 rounded-lg border border-gray-200"
                      style={{ backgroundColor: formData.primaryColor }}
                    />
                    <input
                      type="color"
                      name="primaryColor"
                      value={formData.primaryColor}
                      onChange={handleChange}
                      className="h-12 w-12 cursor-pointer rounded-lg border border-gray-300 p-1"
                    />
                    <input
                      type="text"
                      name="primaryColor"
                      value={formData.primaryColor}
                      onChange={handleChange}
                      className="flex-1 rounded-xl border px-3 py-2 focus:border-indigo-500 focus:outline-none"
                      placeholder="#4f46e5"
                    />
                  </div>
                  {errors.primaryColor && (
                    <span className="text-xs text-red-600">{errors.primaryColor}</span>
                  )}
                </div>

                <div ref={secondaryRef}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Secondary Color
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={secondarySearch}
                      onChange={(event) => {
                        setSecondarySearch(event.target.value);
                        setSecondaryDropdownOpen(true);
                      }}
                      onFocus={() => setSecondaryDropdownOpen(true)}
                      placeholder="Search or pick a color"
                      className="w-full rounded-xl border px-3 py-2 focus:border-indigo-500 focus:outline-none"
                    />
                    <div
                      className={`absolute z-10 mt-1 w-full rounded-xl border bg-white shadow-lg dark:bg-gray-900 dark:border-gray-700 ${
                        secondaryDropdownOpen ? "block" : "hidden"
                      }`}
                    >
                      {filteredSecondaryOptions.length > 0 ? (
                        filteredSecondaryOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              updateColor("secondaryColor", option.value);
                              setSecondaryDropdownOpen(false);
                            }}
                            className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-gray-700 hover:bg-indigo-50 dark:text-gray-200 dark:hover:bg-indigo-600"
                          >
                            <span
                              className="h-6 w-6 rounded-full border border-gray-300"
                              style={{ backgroundColor: option.value }}
                            />
                            <div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-300">
                                {option.description}
                              </div>
                            </div>
                            <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                              {option.value}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                          No colors match your search.
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div
                      className="h-12 w-12 rounded-lg border border-gray-200"
                      style={{ backgroundColor: formData.secondaryColor }}
                    />
                    <input
                      type="color"
                      name="secondaryColor"
                      value={formData.secondaryColor}
                      onChange={handleChange}
                      className="h-12 w-12 cursor-pointer rounded-lg border border-gray-300 p-1"
                    />
                    <input
                      type="text"
                      name="secondaryColor"
                      value={formData.secondaryColor}
                      onChange={handleChange}
                      className="flex-1 rounded-xl border px-3 py-2 focus:border-indigo-500 focus:outline-none"
                      placeholder="#7c3aed"
                    />
                  </div>
                  {errors.secondaryColor && (
                    <span className="text-xs text-red-600">{errors.secondaryColor}</span>
                  )}
                </div>
              </div>

              {/* Owner Information */}
              <div className="grid gap-4 lg:grid-cols-2">
                <label className="flex flex-col text-sm font-semibold text-gray-700">
                  Owner full name
                  <input
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleChange}
                    className="mt-1 rounded-xl border px-3 py-2 focus:border-indigo-500 focus:outline-none"
                  />
                  {errors.ownerName && (
                    <span className="text-xs text-red-600">{errors.ownerName}</span>
                  )}
                </label>
                <label className="flex flex-col text-sm font-semibold text-gray-700">
                  Owner email
                  <input
                    name="ownerEmail"
                    type="email"
                    value={formData.ownerEmail}
                    onChange={handleChange}
                    className="mt-1 rounded-xl border px-3 py-2 focus:border-indigo-500 focus:outline-none"
                  />
                  {errors.ownerEmail && (
                    <span className="text-xs text-red-600">{errors.ownerEmail}</span>
                  )}
                </label>
              </div>

              <label className="flex flex-col text-sm font-semibold text-gray-700">
                Owner password
                <input
                  name="ownerPassword"
                  type="password"
                  value={formData.ownerPassword}
                  onChange={handleChange}
                  className="mt-1 rounded-xl border px-3 py-2 focus:border-indigo-500 focus:outline-none"
                />
                {errors.ownerPassword && (
                  <span className="text-xs text-red-600">{errors.ownerPassword}</span>
                )}
              </label>

              {/* Preview */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
                <div 
                  className="p-6 rounded-xl border-2 border-gray-200"
                  style={{
                    '--primary-color': formData.primaryColor,
                    '--secondary-color': formData.secondaryColor,
                  }}
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <div 
                      className="w-12 h-12 rounded-lg p-1 shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, ${formData.primaryColor}, ${formData.secondaryColor})`
                      }}
                    >
                      <img
                        src={logoFile ? URL.createObjectURL(logoFile) : "/placeholder-logo.png"}
                        alt="Preview Logo"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold">{formData.tenantName || "Company Name"}</h4>
                      <p className="text-sm text-gray-600">Leave Management System</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      className="btn-primary px-6 py-2 rounded-xl font-semibold"
                      style={{
                        background: `linear-gradient(135deg, ${formData.primaryColor}, ${formData.secondaryColor})`
                      }}
                    >
                      Primary Button
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold uppercase text-white transition hover:bg-indigo-500 disabled:opacity-60"
              >
                {isLoading ? "Creating tenant..." : "Create tenant and owner"}
              </button>

              {errors.submit && (
                <p className="text-center text-sm text-red-600">{errors.submit}</p>
              )}
              {success && (
                <p className="text-center text-sm text-green-600">{success}</p>
              )}
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default TenantRegister;
