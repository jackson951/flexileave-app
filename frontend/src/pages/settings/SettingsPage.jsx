import React from "react";
import { useAuth } from "../../contexts/AuthContext";

const SettingsPage = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
        Tenant settings
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Update the organization details for your tenant.
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="flex flex-col text-sm font-semibold text-gray-700 dark:text-gray-300">
          Tenant name
          <input
            type="text"
            value={user.tenant?.name || ""}
            readOnly
            className="mt-1 rounded-xl border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-600 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </label>
        <label className="flex flex-col text-sm font-semibold text-gray-700 dark:text-gray-300">
          Tenant slug
          <input
            type="text"
            value={user.tenant?.slug || ""}
            readOnly
            className="mt-1 rounded-xl border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-600 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </label>
      </div>
      <p className="mt-4 rounded-xl border border-dashed border-gray-300 p-3 text-sm text-gray-500 dark:border-gray-700">
        Tenant settings updates are managed via the backend admin console. Contact support to make changes.
      </p>
    </div>
  );
};

export default SettingsPage;
