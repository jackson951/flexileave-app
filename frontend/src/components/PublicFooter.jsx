import { Link } from "react-router-dom";
import digititanLogo from "../assets/digititan-logo.jpg";

const quickLinks = [
  { name: "Home", href: "/" },
  { name: "Features", href: "/features" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
];

const legalLinks = [
  { name: "Privacy", href: "/privacy" },
  { name: "Terms", href: "/terms" },
];

const PublicFooter = () => (
  <footer className="bg-slate-900 text-gray-200">
    <div className="max-w-6xl mx-auto px-4 py-12 grid gap-8 md:grid-cols-3">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <img
            src={digititanLogo}
            alt="FlexiLeave logo"
            className="h-12 w-12 object-cover rounded-2xl shadow-lg"
          />
          <div>
            <h3 className="text-lg font-semibold text-white">FlexiLeave</h3>
            <p className="text-xs text-slate-400 uppercase tracking-[0.3em]">
              Leave HQ
            </p>
          </div>
        </div>
        <p className="text-sm text-slate-300">
          Modern leave automation for HR teams, managers, and multi-tenant
          organizations.
        </p>
        <p className="text-xs text-slate-500">
          © {new Date().getFullYear()} FlexiLeave. All rights reserved.
        </p>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-white tracking-[0.2em] uppercase">
          Quick Links
        </h4>
        <div className="mt-3 space-y-2 text-sm">
          {quickLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              className="block text-slate-300 hover:text-white transition"
            >
              {link.name}
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-white tracking-[0.2em] uppercase">
          Legal
        </h4>
        <div className="mt-3 space-y-2 text-sm">
          {legalLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              className="block text-slate-300 hover:text-white transition"
            >
              {link.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

export default PublicFooter;
