import { Link } from "react-router-dom";

const TermsPage = () => (
  <div className="bg-white text-slate-900">
    <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-4">
      <p className="text-xs uppercase tracking-[0.5em] text-indigo-500">Terms</p>
      <h1 className="text-4xl font-semibold">Terms of use</h1>
      <p className="text-slate-600">
        By using FlexiLeave, you agree to follow corporate policies, not share
        unauthorized access tokens, and keep account credentials secure.
      </p>
      <div className="space-y-2 text-sm text-slate-500">
        <p>• Accounts may be suspended for misuse.</p>
        <p>• Leave data is the property of the tenant administrator.</p>
        <p>• We reserve the right to update these terms with notice.</p>
      </div>
      <div className="mt-6">
        <Link to="/contact" className="text-indigo-600 hover:underline">
          Need a custom agreement? Reach out to our team.
        </Link>
      </div>
    </section>
  </div>
);

export default TermsPage;
