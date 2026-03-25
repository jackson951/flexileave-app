import React, { useEffect, useMemo, useState } from "react";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import {
  format,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  addDays,
} from "date-fns";
import { useAuth } from "../../contexts/AuthContext";
import ApiService from "../../api/web-api-service";

const TeamCalender = () => {
  const { user } = useAuth();
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const fetchLeaves = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await ApiService.get("/leaves");
      setLeaves(response.data);
    } catch (err) {
      setError("Unable to load team leaves.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchLeaves();
  }, [user]);

  const monthLabel = useMemo(() => format(calendarDate, "MMMM yyyy"), [calendarDate]);

  const days = useMemo(() => {
    const start = startOfMonth(calendarDate);
    const end = endOfMonth(calendarDate);
    const result = [];
    for (let date = start; date <= end; date = addDays(date, 1)) {
      result.push(date);
    }
    return result;
  }, [calendarDate]);

  const filteredLeaves = useMemo(() => {
    if (filter === "all") return leaves;
    return leaves.filter((leave) => leave.leaveType === filter);
  }, [filter, leaves]);

  const stats = useMemo(() => {
    const summary = { total: 0, pending: 0, approved: 0, rejected: 0 };
    filteredLeaves.forEach((leave) => {
      summary.total += 1;
      if (leave.status === "PENDING") summary.pending += 1;
      if (leave.status === "APPROVED") summary.approved += 1;
      if (leave.status === "REJECTED") summary.rejected += 1;
    });
    return summary;
  }, [filteredLeaves]);

  const leavesByDate = useMemo(() => {
    const grouped = {};
    filteredLeaves.forEach((leave) => {
      const leaveStart = new Date(leave.startDate);
      const leaveEnd = new Date(leave.endDate);
      for (
        let day = leaveStart;
        day <= leaveEnd;
        day = addDays(day, 1)
      ) {
        const key = format(day, "yyyy-MM-dd");
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(leave);
      }
    });
    return grouped;
  }, [filteredLeaves]);

  const pageTitle = "Team calendar";

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Team calendar
              </p>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{pageTitle}</h1>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-gray-300 px-3 py-1 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300">
              <CalendarIcon className="h-4 w-4" />
              {monthLabel}
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <button
              onClick={() => setCalendarDate(subMonths(calendarDate, 1))}
              className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setCalendarDate(addMonths(calendarDate, 1))}
              className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming leaves</h2>
          {loading ? (
            <p className="py-4 text-sm text-gray-500">Loading leaves...</p>
          ) : filteredLeaves.length === 0 ? (
            <p className="py-4 text-sm text-gray-500">No leaves booked for this month.</p>
          ) : (
            <div className="mt-4 space-y-3 divide-y divide-gray-100">
              {filteredLeaves.slice(0, 6).map((leave) => (
                <div key={leave.id} className="flex flex-col gap-1 py-3">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {leave.user?.name || "Unknown user"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {format(new Date(leave.startDate), "MMM dd")} –{" "}
                    {format(new Date(leave.endDate), "MMM dd")}
                  </p>
                  <p className="text-xs uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                    {leave.status}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">All leave types</option>
              {["AnnualLeave", "SickLeave", "FamilyResponsibility", "UnpaidLeave", "Other"].map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-100 p-4 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300">
              <p className="text-xs uppercase tracking-wide text-gray-500">Total leaves</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <div className="rounded-xl border border-gray-100 p-4 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300">
              <p className="text-xs uppercase tracking-wide text-gray-500">Pending</p>
              <p className="text-2xl font-semibold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
            </div>
            <div className="rounded-xl border border-gray-100 p-4 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300">
              <p className="text-xs uppercase tracking-wide text-gray-500">Approved</p>
              <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{stats.approved}</p>
            </div>
            <div className="rounded-xl border border-gray-100 p-4 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300">
              <p className="text-xs uppercase tracking-wide text-gray-500">Rejected</p>
              <p className="text-2xl font-semibold text-red-600 dark:text-red-400">{stats.rejected}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Calendar</h2>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {days.map((day) => {
            const dayLeaves = leavesByDate[format(day, "yyyy-MM-dd")] || [];
            return (
              <div key={day.toISOString()} className="rounded-2xl border border-gray-100 p-3 text-sm dark:border-gray-800">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{format(day, "EEE")}</span>
                  <span>{format(day, "d")}</span>
                </div>
                <div className="mt-2 space-y-1">
                  {dayLeaves.slice(0, 2).map((leave) => (
                    <p key={leave.id} className="text-xs text-gray-900 dark:text-white">
                      {leave.user?.name ?? "Unknown"} ▪︎ {leave.leaveType}
                    </p>
                  ))}
                  {dayLeaves.length > 2 && (
                    <p className="text-xs text-gray-500">+{dayLeaves.length - 2} more</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </section>
    </div>
  );
};

export default TeamCalender;
