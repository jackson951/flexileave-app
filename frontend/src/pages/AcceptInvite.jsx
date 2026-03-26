import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ApiService } from "../api/web-api-service";
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
  const [inviteDetails, setInviteDetails] = useState(null);
  const [inviteLoading, setInviteLoading] = useState(true);
  const [inviteError, setInviteError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenFromUrl = params.get("token");
    if (!tokenFromUrl) {
      setInviteError("This invitation link is missing a token.");
      setInviteLoading(false);
      return;
    }

    const fetchInvite = async () => {
      setInviteError("");
      setInviteLoading(true);
      try {
        const response = await ApiService.get("/auth/invite", {
          params: { token: tokenFromUrl },
          withCredentials: true,
        });
        const invite = response.data.invite;
        setInviteDetails(invite);
        setFormData((prev) => ({
          ...prev,
          token: invite.token,
          name: invite.name || prev.name,
        }));
      } catch (error) {
        setInviteError(
          error.response?.data?.message ||
            "We could not verify this invitation. Please ask the sender to resend the link."
        );
      } finally {
        setInviteLoading(false);
      }
    };

    fetchInvite();
  }, [location.search]);

  const validate = () => {
    const validation = {};
    if (!formData.token.trim()) validation.token = "Invitation token is required";
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
    if (!inviteDetails) {
      setInviteError(
        "Unable to verify the invitation. Please refresh or contact your administrator."
      );
      return;
    }
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

  const formattedExpiry = inviteDetails?.expiresAt
    ? new Date(inviteDetails.expiresAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "";

  const approver =
    inviteDetails?.approver || inviteDetails?.reportsTo || null;
  const reportsToLabel = approver
    ? `${approver.name} (${approver.role.toLowerCase()})`
    : "Not assigned yet";
  const reportsToEmail = approver?.email || "";

  const canSubmit =
    !inviteLoading && !inviteError && Boolean(inviteDetails) && !isLoading;

  return (
    <>
      <Helmet>
        <title>Accept Invite | FlexiLeave</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-gray-50 dark:from-slate-900 dark:to-black">
        <div className="flex min-h-screen items-center justify-center px-4 py-10">
          <div className="w-full max-w-3xl rounded-3xl border border-gray-200 bg-white/90 p-8 shadow-2xl backdrop-blur dark:border-gray-800 dark:bg-slate-900/80">
            <div className="mb-6 text-center">
              <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
                Accept your invite
              </h1>
              <p className="text-gray-500 dark:text-gray-300">
                Review the details below, set a secure password, and you are
                ready to start using FlexiLeave.
              </p>
            </div>

            {inviteLoading ? (
              <div className="flex flex-col items-center justify-center space-y-3 py-12">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-400 border-t-transparent" />
                <p className="text-sm font-medium text-indigo-600">
                  Loading invitation details…
                </p>
              </div>
            ) : inviteError ? (
              <div className="space-y-4 rounded-2xl bg-red-50 p-5 text-center text-sm text-red-700 dark:bg-red-900/40">
                <p>{inviteError}</p>
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="inline-flex items-center justify-center rounded-full border border-red-300 px-4 py-2 text-xs font-semibold uppercase text-red-600 transition hover:bg-red-100 dark:border-red-600 dark:text-red-200 dark:hover:bg-red-500/20"
                >
                  Return to login
                </button>
              </div>
            ) : (
              <form
                className="space-y-6"
                onSubmit={handleSubmit}
                aria-live="polite"
              >
                <div className="space-y-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 p-5 dark:border-gray-700 dark:bg-gray-900/60">
                  <div className="grid gap-4 md:grid-cols-4">
                    <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Token
                      <input
                        name="token"
                        value={formData.token}
                        readOnly
                        className="mt-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                      />
                    </label>
                    <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Full name
                      <input
                        name="name"
                        value={formData.name}
                        readOnly
                        className="mt-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                      />
                    </label>
                    <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Email
                      <input
                        value={inviteDetails?.email || ""}
                        readOnly
                        className="mt-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                      />
                    </label>
                    <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Reports to
                      <input
                        value={reportsToLabel}
                        readOnly
                        className="mt-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                      />
                      {reportsToEmail && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {reportsToEmail}
                        </span>
                      )}
                    </label>
                </div>
                {formattedExpiry && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Invitation expires on {formattedExpiry}
                  </p>
                )}
                {errors.token && (
                  <p className="text-xs text-red-600">
                    {errors.token}
                  </p>
                )}
              </div>

                <div className="space-y-4">
                  <label className="flex flex-col text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Password
                    <input
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="mt-2 rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    />
                    {errors.password && (
                      <span className="mt-1 text-xs text-red-600">
                        {errors.password}
                      </span>
                    )}
                  </label>

                  <label className="flex flex-col text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Confirm password
                    <input
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="mt-2 rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    />
                    {errors.confirmPassword && (
                      <span className="mt-1 text-xs text-red-600">
                        {errors.confirmPassword}
                      </span>
                    )}
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-semibold uppercase text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? "Accepting invite…" : "Accept invite"}
                </button>

                {errors.submit && (
                  <p className="text-center text-sm text-red-600">
                    {errors.submit}
                  </p>
                )}
                {success && (
                  <p className="text-center text-sm text-green-600">{success}</p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AcceptInvite;
