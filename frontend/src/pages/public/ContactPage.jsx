const ContactPage = () => (
  <div className="bg-white text-slate-900">
    <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="mb-12 space-y-3 text-center">
        <p className="text-xs uppercase tracking-[0.5em] text-indigo-500">
          Contact
        </p>
        <h1 className="text-4xl font-semibold">Let&apos;s build a leave workspace</h1>
        <p className="text-sm text-slate-500">
          Tell us about your team, and we&apos;ll make sure you onboard with the
          right user flows, branding, and approval hierarchy.
        </p>
      </div>

      <form className="space-y-6 bg-slate-50 border border-gray-100 rounded-3xl p-8 shadow-lg">
        <div className="grid gap-6 md:grid-cols-2">
          <label className="flex flex-col text-sm font-semibold text-slate-600">
            Name
            <input
              className="mt-2 rounded-2xl border border-gray-200 px-4 py-3"
              placeholder="Your name"
            />
          </label>
          <label className="flex flex-col text-sm font-semibold text-slate-600">
            Email
            <input
              type="email"
              className="mt-2 rounded-2xl border border-gray-200 px-4 py-3"
              placeholder="you@company.com"
            />
          </label>
        </div>
        <label className="flex flex-col text-sm font-semibold text-slate-600">
          Message
          <textarea
            className="mt-2 rounded-2xl border border-gray-200 px-4 py-3 min-h-[150px]"
            placeholder="Tell us about your company, size, or leave challenges."
          />
        </label>
        <button
          type="button"
          className="w-full py-3 rounded-full bg-gradient-to-r from-indigo-600 to-pink-500 text-white font-semibold shadow-lg"
        >
          Send message
        </button>
        <p className="text-xs text-slate-500 text-center">
          You can also email{" "}
          <a
            href="mailto:sales@flexileave.com"
            className="text-indigo-600 hover:underline"
          >
            sales@flexileave.com
          </a>{" "}
          for a quick call.
        </p>
      </form>
    </section>
  </div>
);

export default ContactPage;
