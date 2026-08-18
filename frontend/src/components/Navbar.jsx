import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Brain, FileQuestion, History, Menu, X, Play } from "lucide-react";
import { useState } from "react";

// Only features that exist in ResInt are exposed in the menu.
const navItems = [
  { to: "/", label: "Dashboard", icon: Brain, end: true },
  { to: "/question-bank", label: "Question Bank", icon: FileQuestion },
  { to: "/history", label: "Performance History", icon: History },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const interviewActive = location.pathname === "/questions";

  const linkClass = ({ isActive }) =>
    `inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
      isActive
        ? "bg-indigo-50 text-indigo-700"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

  return (
    <nav
      className={`sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur ${
        interviewActive ? "shadow-sm" : ""
      }`}
    >
      <div className="mx-auto flex min-h-[64px] max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo / Brand */}
        <NavLink
          to="/"
          className="flex shrink-0 items-center gap-2.5"
          onClick={() => setMobileOpen(false)}
        >
          <div className="flex h-10 w-14 items-center justify-center overflow-hidden rounded-lg">
            <img
              src="/interview-logo.png"
              alt="IntervAI"
              className="h-full w-full object-contain"
            />
          </div>

          <div>
            <p className="text-base font-black tracking-tight text-slate-900">
              IntervAI
            </p>
            <p className="hidden text-[10px] font-medium text-slate-400 sm:block">
              Resume Interview Practice
            </p>
          </div>
        </NavLink>

        {/* Desktop navigation */}
        <div className="hidden items-center gap-1 md:flex">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={linkClass}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setMobileOpen((open) => !open)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
        >
          {mobileOpen ? <X size={23} /> : <Menu size={23} />}
        </button>
      </div>

      {/* Mobile navigation */}
      {mobileOpen && (
        <div className="border-t border-slate-100 bg-white px-4 pb-4 pt-3 md:hidden">
          <div className="space-y-1">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`
                }
              >
                <Icon size={17} />
                {label}
              </NavLink>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              navigate("/");
            }}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white"
          >
            <Play size={16} fill="currentColor" />
            Start Mock Interview
          </button>
        </div>
      )}
    </nav>
  );
}