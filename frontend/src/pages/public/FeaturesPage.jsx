import {
  DocumentCheckIcon,
  ShieldCheckIcon,
  BellAlertIcon,
  CubeIcon,
  ChartPieIcon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";

const features = [
  {
    title: "Leave requests",
    copy:
      "Intuitive forms with policy-aware guidance, file attachments, and automatic balance checks.",
    icon: DocumentCheckIcon,
    detail:
      "Employees can request Annual, Sick, Family or custom leave types. The platform validates balances before submission and captures rationale + attachments.",
  },
  {
    title: "Hierarchical approvals",
    copy:
      "Approvals follow reporting lines so managers, admins, and owners see requests in their exact orbit.",
    icon: ShieldCheckIcon,
    detail:
      "Only the designated reportsTo user receives the pending notification. Self-approval is blocked and audit logs capture every decision.",
  },
  {
    title: "Notifications",
    copy:
      "Email and in-app alerts notify assigned approvers, requesters, and system watchers.",
    icon: BellAlertIcon,
    detail:
      "Send branded emails, push in-app notifications, and keep teams informed when leave is submitted, approved, or rejected.",
  },
  {
    title: "Multi-tenancy",
    copy:
      "Host unlimited tenants with isolated data, theme controls, and invite flows for each company.",
    icon: CubeIcon,
    detail:
      "Every organization can customize colors, logos, and invite templates while sharing the same infrastructure.",
  },
  {
    title: "Notification insights",
    copy:
      "Reporting dashboards track approvals, upcoming leave coverage, and team availability.",
    icon: ChartPieIcon,
    detail:
      "Export leave summaries, filter by department, and surface pending approvals across every tenant.",
  },
];

const FeaturesPage = () => (
  <div className="bg-white text-slate-900">
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <p className="text-xs uppercase tracking-[0.5em] text-indigo-500">
        Product Tour
      </p>
      <h1 className="text-4xl font-semibold mt-3">
        Modern leave automation for teams & HR.
      </h1>
      <p className="max-w-2xl text-lg text-slate-600 mt-3">
        FlexiLeave blends leave workflows, hierarchical approvals, notifications,
        and multi-tenant controls into a single, polished SaaS workspace.
      </p>

      <div className="mt-12 grid gap-8 md:grid-cols-2">
        {features.map((feature) => (
          <article
            key={feature.title}
            className="rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4 hover:shadow-lg transition"
          >
            <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
              <feature.icon className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-semibold">{feature.title}</h2>
            <p className="text-sm text-slate-600">{feature.copy}</p>
            <p className="text-sm text-slate-500">{feature.detail}</p>
          </article>
        ))}
      </div>

      <div className="mt-12 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 space-y-3">
          <h3 className="text-xl font-semibold">Want to explore more?</h3>
          <p className="text-sm text-slate-500">
            Every plan includes free-onboarding, dedicated email support, and
            enterprise-grade security controls.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/register"
            className="px-5 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-pink-500 text-white font-semibold"
          >
            Launch a tenant
          </Link>
          <Link
            to="/contact"
            className="px-5 py-3 rounded-full border border-indigo-200 text-indigo-600 font-semibold"
          >
            Talk to sales
          </Link>
        </div>
      </div>
    </section>
  </div>
);

export default FeaturesPage;
