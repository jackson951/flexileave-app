import React, { useEffect, useMemo, useState } from "react";
import {
  ChartBarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { formatDistanceToNow } from "date-fns";
import { ApiService } from "../../api/web-api-service";

const defaultFilters = {
  department: "",
  startDate: "",
  endDate: "",
};

const statusLabels = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  approved: { label: "Approved", color: "bg-green-100 text-green-800" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800" },
};

const DashboardStatCard = ({ title, value, icon, meta }) => (
  <div className="flex items-start space-x-4 rounded-2xl border border-gray-200 bg-white/80 px-5 py-4 shadow-sm transition hover:border-indigo-500 hover:shadow-md dark:border-gray-700 dark:bg-gray-900">
    <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-200">
      <span className="sr-only">{title}</span>
      {icon}
    </div>
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {title}
      </p>
      <p className="text-2xl font-semibold text-gray-900 dark:text-white">
        {value ?? "—"}
      </p>
      {meta && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{meta}</p>
      )}
    </div>
  </div>
);

const FilterPill = ({ label, value }) => (
  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-200">
    {label}: {value}
  </span>
);

const TenantDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState(defaultFilters);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    setError(null);
    setLoading(true);
    try {
      const params = {};
      if (filters.department) params.department = filters.department;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      const response = await ApiService.get("/tenants/stats", { params });
      setStats(response.data.stats);
    } catch (err) {
      console.error("Failed to load tenant stats", err);
      setError("Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const monthlyMax = useMemo(() => {
    if (!stats) return 1;
    return Math.max(
      1,
      ...(stats.leaves?.monthlyTrends ?? []).map((segment) => segment.total)
    );
  }, [stats]);

  const activeFilters = useMemo(() => {
    return Object.entries(filters).filter(
      ([, value]) => value && value.length > 0
    );
  }, [filters]);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white/80 p-6 backdrop-blur dark:border-gray-700 dark:bg-gray-900">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Tenant Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Real-time insights for your tenant: people, leaves, and trends.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {activeFilters.map(([key, value]) => (
            <FilterPill key={key} label={key} value={value} />
          ))}
        </div>
        <form
          className="grid gap-3 sm:grid-cols-3"
          onSubmit={(event) => {
            event.preventDefault();
            fetchStats();
          }}
        >
          <label className="flex flex-col text-sm text-gray-600 dark:text-gray-300">
            Department
            <input
              type="text"
              value={filters.department}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, department: event.target.value }))
              }
              placeholder="e.g. Engineering"
              className="mt-1 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
            />
          </label>
          <label className="flex flex-col text-sm text-gray-600 dark:text-gray-300">
            Start Date
            <input
              type="date"
              value={filters.startDate}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, startDate: event.target.value }))
              }
              className="mt-1 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </label>
          <label className="flex flex-col text-sm text-gray-600 dark:text-gray-300">
            End Date
            <input
              type="date"
              value={filters.endDate}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, endDate: event.target.value }))
              }
              className="mt-1 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </label>
          <div className="flex items-end gap-2 sm:col-span-3">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
              disabled={loading}
            >
              Apply filters
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-400 dark:border-gray-700 dark:text-gray-200"
              onClick={() => {
                setFilters(defaultFilters);
                fetchStats();
              }}
            >
              Reset
            </button>
          </div>
        </form>
        {error && (
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </header>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          title="Total Employees"
          value={stats?.users.total}
          icon={<UserGroupIcon className="h-6 w-6" aria-hidden="true" />}
          meta={`Active ${stats?.users.active ?? 0} · Inactive ${
            stats?.users.inactive ?? 0
          }`}
        />
        <DashboardStatCard
          title="Pending Leaves"
          value={stats?.leaves.pending}
          icon={<DocumentTextIcon className="h-6 w-6" aria-hidden="true" />}
          meta={`${stats?.leaves.total ?? 0} total requests`}
        />
        <DashboardStatCard
          title="Approved Leaves"
          value={stats?.leaves.approved}
          icon={<SparklesIcon className="h-6 w-6" aria-hidden="true" />}
          meta={`This month: ${stats?.leaves.thisMonth ?? 0}`}
        />
        <DashboardStatCard
          title="Rejected Leaves"
          value={stats?.leaves.rejected}
          icon={<CalendarDaysIcon className="h-6 w-6" aria-hidden="true" />}
          meta={`Last month: ${stats?.leaves.lastMonth ?? 0}`}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <article className="xl:col-span-2 rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Leaves per month
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Trend over the last six months.
              </p>
            </div>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              {stats?.leaves?.monthlyTrends?.length ?? 0} months
            </span>
          </div>
          <div className="mt-6 grid grid-cols-6 gap-3">
            {(stats?.leaves?.monthlyTrends ?? []).map((segment) => (
              <div key={segment.label} className="flex flex-col items-center gap-2">
                <div className="flex h-40 w-full items-end rounded-xl bg-gray-100 dark:bg-gray-800">
                  <div
                    className="w-full rounded-b-xl bg-gradient-to-t from-indigo-600 to-indigo-400"
                    style={{
                      height: `${(segment.total / monthlyMax) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 text-center">
                  {segment.label}
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {segment.total}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Leave type breakdown
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Distribution of leave requests.
          </p>
          <div className="mt-4 space-y-3">
            {(stats?.leaves?.leaveTypeBreakdown ?? []).map((type) => {
              const width = Math.min(
                100,
                Math.round(
                  (type.count / (stats?.leaves.total || 1)) * 100
                )
              );
              return (
                <div key={type.leaveType}>
                  <div className="flex items-center justify-between text-sm font-medium text-gray-800 dark:text-gray-200">
                    <span>{type.leaveType}</span>
                    <span>{type.count}</span>
                  </div>
                  <div className="mt-1 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-800">
                    <div
                      className="h-2 rounded-full bg-indigo-500"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent activity
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Latest leaves and approvals.
          </p>
          <div className="mt-4 divide-y divide-gray-200 dark:divide-gray-700">
            {(stats?.leaves?.recentLeaves ?? []).map((leave) => (
              <div key={leave.id} className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {leave.leaveType}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {leave.user?.name} · {leave.user?.department || "General"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      statusLabels[leave.status?.toLowerCase()]?.color ||
                      "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {statusLabels[leave.status?.toLowerCase()]?.label ??
                      leave.status}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    Submitted{" "}
                    {formatDistanceToNow(new Date(leave.submittedAt), {
                      addSuffix: true,
                    })}
                  </span>
                  {leave.actionedBy && (
                    <span>Actioned by {leave.actionedBy.name}</span>
                  )}
                </div>
              </div>
            ))}
            {!stats?.leaves.recentLeaves?.length && (
              <p className="py-4 text-sm text-gray-500 dark:text-gray-400">
                No recent activity yet.
              </p>
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Leaves this month
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Snapshot of the current month.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-dashed border-indigo-200 px-4 py-3 text-center">
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                Total
              </p>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-300">
                {stats?.leaves.thisMonth ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-dashed border-yellow-200 px-4 py-3 text-center">
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                Pending
              </p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-300">
                {stats?.leaves.pending ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-dashed border-green-200 px-4 py-3 text-center">
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                Approved
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-300">
                {stats?.leaves.approved ?? 0}
              </p>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
};

export default TenantDashboard;
