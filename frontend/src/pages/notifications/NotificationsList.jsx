import React, { useEffect, useState } from "react";
import ApiService from "../../api/web-api-service";
import { useAuth } from "../../contexts/AuthContext";

const NotificationsList = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNotifications = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await ApiService.get("/notifications");
      setNotifications(res.data.data);
    } catch (err) {
      setError("Unable to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markRead = async (id) => {
    try {
      await ApiService.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, isRead: true } : item
        )
      );
    } catch {
      setError("Unable to update notification state");
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
          Notifications
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Stay on top of leave events and approvals.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-red-400 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        {loading ? (
          <p className="py-6 text-center text-sm text-gray-500">Loading...</p>
        ) : notifications.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">
            No notifications yet.
          </p>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-2xl border px-4 py-3 transition ${
                  notification.isRead
                    ? "border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900"
                    : "border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-900/30"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {notification.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-300">
                      {notification.message}
                    </p>
                  </div>
                  <button
                    onClick={() => markRead(notification.id)}
                    className="text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    Mark as read
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default NotificationsList;
