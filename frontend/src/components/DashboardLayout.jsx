import React, { useState } from "react";
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
} from "@heroicons/react/24/outline";

const DashboardLayout = ({ userType, user, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: HomeIcon,
      show: true,
    },
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
      show: userType === "admin",
    },
    {
      name: "Reports",
      href: "/dashboard/reports",
      icon: ChartBarIcon,
      show: userType === "admin",
    },
    {
      name: "Employees",
      href: "/dashboard/users",
      icon: UserGroupIcon,
      show: userType === "admin",
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 flex max-w-xs w-full">
            <div className="relative flex-1 flex flex-col w-full bg-white focus:outline-none">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  type="button"
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
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
                  <h1 className="text-2xl font-bold text-indigo-600">
                    LeaveTrack
                  </h1>
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
                              ? "bg-indigo-50 text-indigo-600"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                          } group flex items-center px-2 py-2 text-base font-medium rounded-md w-full`}
                        >
                          <item.icon
                            className={`${
                              item.current
                                ? "text-indigo-600"
                                : "text-gray-400 group-hover:text-gray-500"
                            } mr-4 h-6 w-6`}
                            aria-hidden="true"
                          />
                          {item.name}
                        </button>
                      ))}
                  </div>
                </nav>
              </div>
              <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                <div className="flex items-center">
                  <div>
                    <img
                      className="inline-block h-10 w-10 rounded-full"
                      src={
                        user?.avatar ||
                        "https://ui-avatars.com/api/?name=" + user?.name
                      }
                      alt=""
                    />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                      {user?.name}
                    </p>
                    <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700">
                      {user?.role}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="ml-auto flex-shrink-0 bg-white p-2 text-gray-400 hover:text-gray-500"
                >
                  <ArrowRightOnRectangleIcon
                    className="h-6 w-6"
                    aria-hidden="true"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Static sidebar for desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64 border-r border-gray-200 pt-5 pb-4 bg-white overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-2xl font-bold text-indigo-600">LeaveTrack</h1>
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
                        ? "bg-indigo-50 text-indigo-600"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full`}
                  >
                    <item.icon
                      className={`${
                        item.current
                          ? "text-indigo-600"
                          : "text-gray-400 group-hover:text-gray-500"
                      } mr-3 h-6 w-6`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </button>
                ))}
            </div>
          </nav>
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div>
                <img
                  className="inline-block h-10 w-10 rounded-full"
                  src={
                    user?.avatar ||
                    "https://ui-avatars.com/api/?name=" + user?.name
                  }
                  alt=""
                />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                  {user?.name}
                </p>
                <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700">
                  {user?.role}
                </p>
              </div>
              <button
                onClick={onLogout}
                className="ml-auto flex-shrink-0 bg-white p-2 text-gray-400 hover:text-gray-500"
              >
                <ArrowRightOnRectangleIcon
                  className="h-6 w-6"
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white border-b border-gray-200 lg:hidden">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="flex-1 flex justify-between px-4">
            <div className="flex-1 flex">
              <div className="w-full flex md:ml-0">
                <h1 className="text-xl font-semibold text-gray-900 self-center">
                  LeaveTrack
                </h1>
              </div>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              <button
                type="button"
                className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={onLogout}
              >
                <ArrowRightOnRectangleIcon
                  className="h-6 w-6"
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
