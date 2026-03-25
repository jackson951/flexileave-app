import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Helmet } from "react-helmet-async";

const AcceptInvite = () => {
  const { acceptInvite } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    token: "",
    name: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenFromUrl = params.get("token");
    if (tokenFromUrl) {
      setFormData((prev) => ({ ...prev, token: tokenFromUrl }));
    }
  }, [location.search]);

  const validate = () => {
    const validation = {};
    if (!formData.token.trim()) validation.token = "Invitation token is required";
    if (!formData.name.trim()) validation.name = "Your full name is required";
    if (!formData.password) validation.password = "Password is required";
    else if (formData.password.length < 8)
      validation.password = "Password must be at least 8 characters";
    if (formData.password !== formData.confirmPassword)
      validation.confirmPassword = "Passwords must match";
    setErrors(validation);
    return Object.keys(validation).length === 0;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      await acceptInvite({
        token: formData.token,
        name: formData.name,
        password: formData.password,
      });
      setSuccess("Invite accepted. Redirecting...");
      setTimeout(() => navigate("/dashboard/leave"), 1200);
    } catch (error) {
      setErrors({
        submit: error.response?.data?.message || "Unable to accept invite",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Accept Invite | FlexiLeave</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-gray-50">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl border bg-white/90 p-8 shadow-xl">
            <div className="mb-6 text-center">
              <h1 className="text-3xl font-semibold text-gray-900">
                Accept your invite
              </h1>
              <p className="text-gray-500">
                Set your password and finish onboarding.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="flex flex-col text-sm font-semibold text-gray-700">
                Invitation token
                <input
                  name="token"
                  value={formData.token}
                  onChange={handleChange}
                  className="mt-1 rounded-xl border px-3 py-2 focus:border-indigo-500 focus:outline-none"
                />
                {errors.token && (
                  <span className="text-xs text-red-600">{errors.token}</span>
                )}
              </label>

              <label className="flex flex-col text-sm font-semibold text-gray-700">
                Full name
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 rounded-xl border px-3 py-2 focus:border-indigo-500 focus:outline-none"
                />
                {errors.name && (
                  <span className="text-xs text-red-600">{errors.name}</span>
                )}
              </label>

              <label className="flex flex-col text-sm font-semibold text-gray-700">
                Password
                <input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="mt-1 rounded-xl border px-3 py-2 focus:border-indigo-500 focus:outline-none"
                />
                {errors.password && (
                  <span className="text-xs text-red-600">{errors.password}</span>
                )}
              </label>

              <label className="flex flex-col text-sm font-semibold text-gray-700">
                Confirm password
                <input
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="mt-1 rounded-xl border px-3 py-2 focus:border-indigo-500 focus:outline-none"
                />
                {errors.confirmPassword && (
                  <span className="text-xs text-red-600">
                    {errors.confirmPassword}
                  </span>
                )}
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold uppercase text-white transition hover:bg-indigo-500 disabled:opacity-60"
              >
                {isLoading ? "Accepting invite..." : "Accept invite"}
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

export default AcceptInvite;
