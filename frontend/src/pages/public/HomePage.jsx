import {
  SparklesIcon,
  ShieldCheckIcon,
  ClockIcon,
  ArrowsRightLeftIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";

const featureCards = [
  {
    title: "Streamlined Requests",
    description:
      "Employees submit leave with context, attachments, and policy guardrails in one tap.",
    icon: SparklesIcon,
  },
  {
    title: "Hierarchical Approvals",
    description:
      "The right manager, admin, or owner always receives requests with audit-ready trails.",
    icon: ShieldCheckIcon,
  },
  {
    title: "Instant Notifications",
    description:
      "Email, in-app, and Slack-style alerts keep approvals moving without manual chasing.",
    icon: ClockIcon,
  },
  {
    title: "Multi-tenant Ready",
    description:
      "Create branded workspaces for each company, control themes, and manage tenants in one pane.",
    icon: ArrowsRightLeftIcon,
  },
  {
    title: "Team Insights",
    description:
      "Live dashboards surface balances, pending requests, and capacity across every team.",
    icon: UsersIcon,
  },
];

const steps = [
  {
    title: "Define your structure",
    copy: "Add tenants, assign roles, and map reporting lines for every employee.",
  },
  {
    title: "Set policy & balance",
    copy: "Setup leave types, balances, and approval rules that auto-enforce compliance.",
  },
  {
    title: "Deliver peace of mind",
    copy: "Teams submit requests, managers approve, and HR tracks everything in real time.",
  },
];

const HomePage = () => (
  <div className="bg-slate-950 text-white">
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 opacity-30 bg-gradient-to-br from-indigo-600 to-purple-700" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.5em] text-indigo-200">
              Leave Management System
            </p>
            <h1 className="text-4xl md:text-5xl font-semibold text-white">
              Automate leave, approvals, and communication for every team.
            </h1>
            <p className="text-lg text-slate-100 max-w-xl">
              FlexiLeave brings policy enforcement, hierarchical approvals, and
              multi-tenant controls into a single, modern SaaS experience built
              for HR and operations teams.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/register"
                className="px-6 py-3 rounded-full bg-white text-indigo-800 font-semibold shadow-lg hover:opacity-90 transition"
              >
                Create Company
              </Link>
              <Link
                to="/login"
                className="px-6 py-3 rounded-full border border-white/40 text-white font-semibold text-opacity-90 hover:text-opacity-100 transition"
              >
                Get Started
              </Link>
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-3xl bg-white/10 border border-white/10 p-6 backdrop-blur shadow-xl">
              <p className="text-xs uppercase tracking-[0.4em] text-indigo-200">
                Live example
              </p>
              <p className="text-sm text-slate-200 mt-2">
                Pending approvals, leave pipeline, and brandable workspace in one
                clean console.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="bg-black/30 rounded-2xl p-3 text-center">
                  <p className="text-2xl font-semibold">184</p>
                  <p className="text-xs uppercase text-slate-300">Requests</p>
                </div>
                <div className="bg-black/30 rounded-2xl p-3 text-center">
                  <p className="text-2xl font-semibold">12</p>
                  <p className="text-xs uppercase text-slate-300">Approvals</p>
                </div>
                <div className="bg-black/30 rounded-2xl p-3 text-center">
                  <p className="text-2xl font-semibold">4</p>
                  <p className="text-xs uppercase text-slate-300">Tenants</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="space-y-3 text-center">
        <p className="text-sm uppercase tracking-[0.4em] text-indigo-400">
          Why teams trust FlexiLeave
        </p>
        <h2 className="text-3xl font-semibold text-white">
          Everything you need to automate leave with enterprise control.
        </h2>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {featureCards.map((feature) => (
          <div
            key={feature.title}
            className="bg-white/5 rounded-3xl p-6 border border-white/10 hover:border-indigo-500 transition"
          >
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white mb-4">
              <feature.icon className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
            <p className="text-sm text-slate-300">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>

    <section className="bg-slate-900/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
        <div className="space-y-3 text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-indigo-400">
            How it works
          </p>
          <h2 className="text-3xl font-semibold text-white">
            Launch in minutes with a guided flow.
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col gap-4"
            >
              <div className="text-sm text-indigo-400 font-semibold">
                Step {index + 1}
              </div>
              <h3 className="text-2xl font-semibold">{step.title}</h3>
              <p className="text-sm text-slate-300">{step.copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid md:grid-cols-2 gap-10 items-center">
      <div className="space-y-4">
        <p className="uppercase tracking-[0.4em] text-indigo-400 text-sm">
          Testimonials
        </p>
        <h2 className="text-3xl font-semibold">Loved by operators & HR</h2>
        <p className="text-lg text-slate-300">
          “FlexiLeave finally gave us peace of mind. The approval hierarchy
          respects our org structure and the reporting keeps leadership informed.”
        </p>
        <p className="text-sm text-slate-500">
          — T. Khuto, HR Director, Barloworld Equipment
        </p>
      </div>
      <div className="rounded-3xl bg-white/5 border border-white/10 p-8">
        <p className="text-sm uppercase tracking-[0.4em] text-indigo-200 mb-4">
          Ready to switch?
        </p>
        <p className="text-lg font-semibold text-white mb-6">
          Secure approvals, automate balance tracking, and keep employees
          informed—without spreadsheets.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/register"
            className="px-5 py-3 rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 text-white font-semibold shadow-lg hover:opacity-90 transition"
          >
            Start Free Trial
          </Link>
          <Link
            to="/contact"
            className="px-5 py-3 rounded-full border border-white/30 text-white text-opacity-90 hover:text-opacity-100 transition"
          >
            Talk to Sales
          </Link>
        </div>
      </div>
    </section>
  </div>
);

export default HomePage;
