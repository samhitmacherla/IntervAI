import { NavLink, useNavigate } from "react-router-dom";
import { BarChart3, BookOpen, Brain, FileText, Play, LogOut } from "lucide-react";

const items = [
  { to: "/", label: "Dashboard", icon: Brain, end: true },
  { to: "/question-bank", label: "Question Bank", icon: BookOpen },
  { to: "/history", label: "Performance History", icon: BarChart3 },
];

export default function InterviewSidebar({ practiceMode = false, resumeName = "Current resume" }) {
  const navigate = useNavigate();
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200 bg-white lg:flex lg:flex-col">
      <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">
       <div className="flex h-10 w-14 items-center justify-center overflow-hidden rounded-lg">
  <img
    src="/interview-logo.png"
    alt="ResInt"
    className="h-full w-full object-contain"
  />
</div>
        <div>
          <p className="text-base font-black tracking-tight text-slate-900">InterviewAI</p>
          <p className="text-xs text-slate-400">Mock Interviews</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-5">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
        <button
          onClick={() => navigate("/")}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
        >
          <Play size={18} />
          {practiceMode ? "Start Mock Interview" : "Start Mock Interview"}
        </button>
      </nav>

      <div className="border-t border-slate-100 p-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <FileText size={15} />
            <span className="text-xs font-semibold">Current resume</span>
          </div>
          <p className="mt-2 line-clamp-2 text-xs font-semibold text-slate-700">{resumeName}</p>
          <button onClick={() => navigate("/")} className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-700">Back to dashboard</button>
        </div>
        <button onClick={() => navigate("/")} className="mt-4 flex items-center gap-3 px-2 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
          <LogOut size={17} /> Exit interview
        </button>
      </div>
    </aside>
  );
}
