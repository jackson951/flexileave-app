import { Link } from "react-router-dom";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import digititanLogo from "../assets/digititan-logo.jpg";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Features", href: "/features" },
  { name: "Pricing", href: "/pricing" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
];

const PublicHeader = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-3">
            <div className="h-10 w-10">
              <img
                src={digititanLogo}
                alt="FlexiLeave logo"
                className="h-full w-full object-cover rounded-2xl shadow-lg"
              />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900 leading-tight">
                FlexiLeave
              </p>
              <p className="text-xs text-gray-500 uppercase tracking-[0.3em]">
                Leave Management
              </p>
            </div>
          </Link>

          <nav className="hidden lg:flex lg:items-center lg:space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center space-x-3">
            <Link
              to="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-pink-500 px-4 py-2 rounded-full shadow-lg hover:opacity-90 transition"
            >
              Get Started
            </Link>
          </div>

          <button
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="lg:hidden text-gray-600 hover:text-gray-900"
          >
            {mobileOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white/95">
          <nav className="px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                onClick={() => setMobileOpen(false)}
                className="block text-base font-medium text-gray-700 hover:text-gray-900"
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-2 border-t border-gray-200 flex items-center justify-between">
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="text-sm font-medium text-gray-600"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="text-sm font-semibold text-white bg-indigo-600 px-4 py-2 rounded-full shadow"
              >
                Get Started
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default PublicHeader;
