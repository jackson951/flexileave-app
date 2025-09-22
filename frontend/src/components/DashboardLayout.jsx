import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  ChartBarIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  HomeIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  UserGroupIcon,
  XMarkIcon,
  CalendarDaysIcon,
  BellIcon,
  MoonIcon,
  SunIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../contexts/AuthContext";
import digititanLogo from "../assets/digititan-logo.jpeg";

const DashboardLayout = () => {
  const { user: authUser, logout, logoutLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Mock notifications data
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Leave Request Approved",
      message: "Your leave request for September 15-20 has been approved",
      time: "2 hours ago",
      read: false,
      type: "success",
    },
    {
      id: 2,
      title: "New Message",
      message: "You have a new message from HR department",
      time: "5 hours ago",
      read: false,
      type: "info",
    },
    {
      id: 3,
      title: "Upcoming Deadline",
      message: "Quarterly reports are due next Friday",
      time: "1 day ago",
      read: true,
      type: "warning",
    },
  ]);

  // Toggle dark mode and update document class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const navigation = [
    {
      name: "Leave Requests",
      href: "/dashboard/leave",
      icon: DocumentTextIcon,
      show: true,
    },
    {
      name: "New Request",
      href: "/dashboard/leave/new",
      icon: DocumentTextIcon,
      show: true,
    },
    {
      name: "Team Calendar",
      href: "/dashboard/calendar",
      icon: CalendarDaysIcon,
      show: authUser?.role === "admin",
    },
    {
      name: "Reports",
      href: "/dashboard/reports",
      icon: ChartBarIcon,
      show: authUser?.role === "admin",
    },
    {
      name: "Employees",
      href: "/dashboard/users",
      icon: UserGroupIcon,
      show: authUser?.role === "admin",
    },
    {
      name: "Profile Settings",
      href: "/dashboard/profile",
      icon: Cog6ToothIcon,
      show: true,
    },
  ].map((item) => ({
    ...item,
    current: location.pathname === item.href,
  }));

  const handleNavigationClick = (href) => {
    navigate(href);
    setSidebarOpen(false);
  };

  const markNotificationAsRead = (id) => {
    setNotifications(
      notifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(
      notifications.map((notification) => ({
        ...notification,
        read: true,
      }))
    );
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75 dark:bg-gray-800 dark:bg-opacity-75"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 flex max-w-xs w-full">
            <div className="relative flex-1 flex flex-col w-full bg-white dark:bg-gray-800 focus:outline-none">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  type="button"
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full"
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="sr-only">Close sidebar</span>
                  <XMarkIcon
                    className="h-6 w-6 text-white"
                    aria-hidden="true"
                  />
                </button>
              </div>
              <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                <div className="flex-shrink-0 flex items-center px-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 shadow-lg">
                      <img
                        src={digititanLogo}
                        alt="Digititan Logo"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                        Digititan
                      </h1>
                      <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">
                        Leave Management
                      </p>
                    </div>
                  </div>
                </div>
                <nav aria-label="Sidebar" className="mt-5">
                  <div className="px-2 space-y-1">
                    {navigation
                      .filter((item) => item.show)
                      .map((item) => (
                        <button
                          key={item.name}
                          onClick={() => handleNavigationClick(item.href)}
                          className={`${
                            item.current
                              ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-200"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                          } group flex items-center px-2 py-2 text-base font-medium rounded-md w-full`}
                        >
                          <item.icon
                            className={`${
                              item.current
                                ? "text-indigo-600 dark:text-indigo-400"
                                : "text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300"
                            } mr-4 h-6 w-6`}
                            aria-hidden="true"
                          />
                          {item.name}
                        </button>
                      ))}
                  </div>
                </nav>
              </div>
              <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center w-full">
                  <div>
                    <img
                      className="inline-block h-10 w-10 rounded-full"
                      src={
                        authUser?.avatar ||
                        "https://ui-avatars.com/api/?name=" + authUser?.name
                      }
                      alt=""
                    />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900 dark:text-gray-200">
                      {authUser?.name}
                    </p>
                    <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700 dark:text-gray-400">
                      {authUser?.position}
                    </p>
                  </div>
                  <button
                    onClick={logout}
                    disabled={logoutLoading}
                    className="ml-auto flex-shrink-0 bg-white dark:bg-gray-800 p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 disabled:opacity-50"
                  >
                    {logoutLoading ? (
                      <div className="h-6 w-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <ArrowRightOnRectangleIcon
                        className="h-6 w-6"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Static sidebar for desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64 border-r border-gray-200 dark:border-gray-700 pt-5 pb-4 bg-white dark:bg-gray-800 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 shadow-lg">
                <img
                  src={digititanLogo}
                  alt="Digititan Logo"
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Digititan
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">
                  Leave Management
                </p>
              </div>
            </div>
          </div>

          <nav className="mt-5 flex-1" aria-label="Sidebar">
            <div className="px-2 space-y-1">
              {navigation
                .filter((item) => item.show)
                .map((item) => (
                  <button
                    key={item.name}
                    onClick={() => handleNavigationClick(item.href)}
                    className={`${
                      item.current
                        ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-200"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full`}
                  >
                    <item.icon
                      className={`${
                        item.current
                          ? "text-indigo-600 dark:text-indigo-400"
                          : "text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300"
                      } mr-3 h-6 w-6`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </button>
                ))}
            </div>
          </nav>
          <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center w-full">
              <div>
                <img
                  className="inline-block h-10 w-10 rounded-full"
                  src={
                    authUser?.avatar ||
                    "https://ui-avatars.com/api/?name=" + authUser?.name
                  }
                  alt=""
                />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900 dark:text-gray-200">
                  {authUser?.name}
                </p>
                <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700 dark:text-gray-400">
                  {authUser?.position}
                </p>
              </div>
              <button
                onClick={logout}
                disabled={logoutLoading}
                className="ml-auto flex-shrink-0 bg-white dark:bg-gray-800 p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 disabled:opacity-50"
              >
                {logoutLoading ? (
                  <div className="h-6 w-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <ArrowRightOnRectangleIcon
                    className="h-6 w-6"
                    aria-hidden="true"
                  />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 lg:hidden">
          <button
            type="button"
            className="px-4 border-r border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="flex-1 flex justify-between px-4 sm:px-6">
            <div className="flex-1 flex">
              <div className="w-full flex md:ml-0">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 shadow-lg">
                    <img
                      src={digititanLogo}
                      alt="Digititan Logo"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    Digititan
                  </h1>
                </div>
              </div>
            </div>
            <div className="ml-4 flex items-center md:ml-6 space-x-3">
              <button
                type="button"
                onClick={() => setDarkMode(!darkMode)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                {darkMode ? (
                  <SunIcon className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <MoonIcon className="h-6 w-6" aria-hidden="true" />
                )}
              </button>

              {/* Notifications dropdown for mobile */}
              <div className="relative">
                <button
                  type="button"
                  className="relative p-1 rounded-full text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                >
                  <span className="sr-only">View notifications</span>
                  <BellIcon className="h-6 w-6" aria-hidden="true" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg py-1 bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
                    <div className="flex justify-between items-center px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        Notifications
                      </h3>
                      {unreadNotificationsCount > 0 && (
                        <button
                          onClick={markAllNotificationsAsRead}
                          className="text-xs text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                              !notification.read
                                ? "bg-indigo-50 dark:bg-indigo-900/20"
                                : ""
                            }`}
                            onClick={() =>
                              markNotificationAsRead(notification.id)
                            }
                          >
                            <div className="flex items-start">
                              <div className="flex-shrink-0 pt-0.5">
                                {notification.type === "success" ? (
                                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                ) : notification.type === "warning" ? (
                                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                                ) : (
                                  <BellIcon className="h-5 w-5 text-blue-500" />
                                )}
                              </div>
                              <div className="ml-3 w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {notification.title}
                                </p>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                  {notification.message}
                                </p>
                                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                                  {notification.time}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                          No notifications
                        </div>
                      )}
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2">
                      <button className="block text-center text-sm font-medium text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 w-full">
                        View all
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 dark:bg-gray-800 dark:hover:text-gray-300 disabled:opacity-50"
                onClick={logout}
                disabled={logoutLoading}
              >
                {logoutLoading ? (
                  <div className="h-6 w-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <ArrowRightOnRectangleIcon
                    className="h-6 w-6"
                    aria-hidden="true"
                  />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Desktop header */}
        <div className="hidden lg:block sticky top-0 z-10 flex-shrink-0 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between px-4 sm:px-6 lg:px-8 h-full">
            <div className="flex-1 flex">
              <div className="flex w-full md:ml-0">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white self-center">
                  {navigation.find((item) => item.current)?.name || "Dashboard"}
                </h2>
              </div>
            </div>
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              <button
                type="button"
                onClick={() => setDarkMode(!darkMode)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                {darkMode ? (
                  <SunIcon className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <MoonIcon className="h-6 w-6" aria-hidden="true" />
                )}
              </button>

              {/* Notifications dropdown */}
              <div className="relative ml-3">
                <button
                  type="button"
                  className="relative p-1 rounded-full text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                >
                  <span className="sr-only">View notifications</span>
                  <BellIcon className="h-6 w-6" aria-hidden="true" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg py-1 bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
                    <div className="flex justify-between items-center px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        Notifications
                      </h3>
                      {unreadNotificationsCount > 0 && (
                        <button
                          onClick={markAllNotificationsAsRead}
                          className="text-xs text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                              !notification.read
                                ? "bg-indigo-50 dark:bg-indigo-900/20"
                                : ""
                            }`}
                            onClick={() =>
                              markNotificationAsRead(notification.id)
                            }
                          >
                            <div className="flex items-start">
                              <div className="flex-shrink-0 pt-0.5">
                                {notification.type === "success" ? (
                                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                ) : notification.type === "warning" ? (
                                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                                ) : (
                                  <BellIcon className="h-5 w-5 text-blue-500" />
                                )}
                              </div>
                              <div className="ml-3 w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {notification.title}
                                </p>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                  {notification.message}
                                </p>
                                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                                  {notification.time}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                          No notifications
                        </div>
                      )}
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2">
                      <button className="block text-center text-sm font-medium text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 w-full">
                        View all
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile dropdown */}
              <div className="relative ml-3">
                <div>
                  <button
                    type="button"
                    className="max-w-xs flex items-center text-sm rounded-full"
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  >
                    <img
                      className="h-8 w-8 rounded-full"
                      src={
                        authUser?.avatar ||
                        "https://ui-avatars.com/api/?name=" + authUser?.name
                      }
                      alt=""
                    />
                    <div className="ml-2 hidden md:block">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        {authUser?.name}
                      </p>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {authUser?.position}
                      </p>
                    </div>
                    <ChevronDownIcon className="ml-1 h-4 w-4 text-gray-400" />
                  </button>
                </div>

                {profileDropdownOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
                    <button
                      onClick={() => {
                        navigate("/dashboard/profile");
                        setProfileDropdownOpen(false);
                      }}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 w-full text-left"
                    >
                      Your Profile
                    </button>
                    <button
                      onClick={() => setProfileDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 w-full text-left"
                    >
                      Settings
                    </button>
                    <div className="border-t border-gray-200 dark:border-gray-700"></div>
                    <button
                      onClick={() => {
                        logout();
                        setProfileDropdownOpen(false);
                      }}
                      disabled={logoutLoading}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 flex items-center"
                    >
                      {logoutLoading ? (
                        <>
                          <div className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                          Signing out...
                        </>
                      ) : (
                        "Sign out"
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
