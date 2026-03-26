import { Link } from "react-router-dom";

const plans = [
  {
    name: "Starter",
    price: "$0",
    description: "Great for small teams experimenting with structured leave.",
    features: ["Unlimited requests", "Email notifications", "Single tenant"],
    badge: "Free",
  },
  {
    name: "Growth",
    price: "$49",
    description: "Best for HR teams that need approvals + multi-tenant control.",
    features: [
      "Hierarchy-based approvals",
      "Multi-tenant branding",
      "Audit-ready reporting",
    ],
    badge: "Most Popular",
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "Dedicated success manager, SSO, and high-touch onboarding.",
    features: [
      "Enterprise security",
      "Dedicated support",
      "Global leave policies",
    ],
    badge: "Premium",
  },
];

const PricingPage = () => (
  <div className="bg-white text-slate-900">
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-8">
      <div className="space-y-3 text-center">
        <p className="text-xs uppercase tracking-[0.5em] text-indigo-500">Pricing</p>
        <h1 className="text-4xl font-semibold">Plans that scale with your organization.</h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Start with a free workspace, add teams, and upgrade as your governance needs grow.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {plans.map((plan) => (
          <article
            key={plan.name}
            className="relative rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">{plan.name}</h2>
              <span className="text-xs uppercase tracking-[0.3em] text-indigo-500">
                {plan.badge}
              </span>
            </div>
            <p className="text-3xl font-semibold mb-4">{plan.price}</p>
            <p className="text-sm text-slate-500 mb-6">{plan.description}</p>
            <ul className="space-y-2 mb-6 text-sm text-slate-600">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-indigo-500" />
                  {feature}
                </li>
              ))}
            </ul>
            <Link
              to={plan.price === "$0" ? "/register" : "/contact"}
              className="mt-auto inline-flex justify-center py-3 rounded-full bg-gradient-to-r from-indigo-600 to-pink-500 text-white font-semibold"
            >
              {plan.price === "$0" ? "Launch Starter" : "Talk to Sales"}
            </Link>
          </article>
        ))}
      </div>
    </section>
  </div>
);

export default PricingPage;
