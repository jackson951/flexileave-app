import { Link } from "react-router-dom";

const PrivacyPage = () => (
  <div className="bg-white text-slate-900">
    <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-4">
      <p className="text-xs uppercase tracking-[0.5em] text-indigo-500">Privacy</p>
      <h1 className="text-4xl font-semibold">Data privacy you can trust.</h1>
      <p className="text-slate-600">
        FlexiLeave is committed to protecting employee data. All tenant data is
        isolated, encrypted at rest, and stored only for as long as it is needed.
      </p>
      <div className="space-y-3 text-sm text-slate-500">
        <p>
          • We use industry-standard encryption for data in transit and at rest.
        </p>
        <p>
          • Access controls and audit logs ensure only authorized approvers see sensitive leave details.
        </p>
        <p>
          • Tenants can request data exports or deletions for compliance.
        </p>
      </div>
      <div className="mt-6">
        <Link to="/contact" className="text-indigo-600 hover:underline">
          Contact us to review the privacy policy in detail
        </Link>
      </div>
    </section>
  </div>
);

export default PrivacyPage;
