import React, { useState } from "react";
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

  const [formData, setFormData] = useState({
    tenantName: "",
    tenantSlug: "",
    ownerName: "",
    ownerEmail: "",
    ownerPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState("");

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
    setErrors(validation);
    return Object.keys(validation).length === 0;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    setSuccess("");
    try {
      await registerTenant({
        tenantName: formData.tenantName,
        tenantSlug: formData.tenantSlug,
        ownerName: formData.ownerName,
        ownerEmail: formData.ownerEmail,
        ownerPassword: formData.ownerPassword,
      });
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
          <div className="w-full max-w-2xl rounded-3xl border bg-white/90 p-8 shadow-xl">
            <div className="mb-6 text-center">
              <h1 className="text-3xl font-semibold text-gray-900">
                Start your organization
              </h1>
              <p className="text-gray-500">
                Register your company and create the first admin account.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
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
