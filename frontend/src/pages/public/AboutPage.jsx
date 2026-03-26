import { Link } from "react-router-dom";

const AboutPage = () => (
  <div className="bg-white text-slate-900">
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-10">
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.5em] text-indigo-500">
          About FlexiLeave
        </p>
        <h1 className="text-4xl font-semibold">Built for compliant HR teams.</h1>
        <p className="text-lg text-slate-600">
          We help companies stop juggling spreadsheets and manual approvals. FlexiLeave
          runs leave programs that respect reporting hierarchies, automation,
          multi-tenant needs, and real-time visibility.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <article className="p-6 rounded-3xl shadow-lg border border-gray-100">
          <h3 className="text-xl font-semibold mb-2">Purpose-built</h3>
          <p className="text-sm text-slate-500">
            Purpose-built leave workflows give HR teams everything from leave
            balances to supporting documents, all within one secure tenant.
          </p>
        </article>
        <article className="p-6 rounded-3xl shadow-lg border border-gray-100">
          <h3 className="text-xl font-semibold mb-2">Human-centered</h3>
          <p className="text-sm text-slate-500">
            Approvals are assigned automatically, notifications keep teams aligned,
            and self-service empowers employees.
          </p>
        </article>
        <article className="p-6 rounded-3xl shadow-lg border border-gray-100">
          <h3 className="text-xl font-semibold mb-2">Enterprise-ready</h3>
          <p className="text-sm text-slate-500">
            Multi-tenancy, audit trails, and role-aware dashboards keep global
            operations compliant and confident.
          </p>
        </article>
      </div>

      <div className="rounded-3xl border border-indigo-100 bg-indigo-50 p-8">
        <p className="text-sm uppercase tracking-[0.4em] text-indigo-500">
          Who we serve
        </p>
        <h2 className="text-3xl font-semibold mt-3">
          Companies, HR leaders, and team managers who need structured leave
          automation.
        </h2>
        <p className="mt-4 text-slate-600">
          Flexible approvals, transparent reporting, and white-glove onboarding
          help distributed teams stay aligned on absences, coverage, and critical
          staffing decisions.
        </p>
        <Link
          to="/pricing"
          className="inline-flex mt-6 px-6 py-3 rounded-full bg-slate-900 text-white font-semibold"
        >
          Explore plans
        </Link>
      </div>
    </section>
  </div>
);

export default AboutPage;
