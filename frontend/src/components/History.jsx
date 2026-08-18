import { FileText, ChevronRight } from "lucide-react";

// Props: sessions (array from GET /api/history), onSelect(id)
export default function History({ sessions, onSelect }) {
  if (!sessions || sessions.length === 0) {
    return <p className="text-sm text-slate-500 text-center py-10">No past interviews yet — run one from the Home tab.</p>;
  }

  return (
    <div className="space-y-2">
      {sessions.map((s) => (
        <button
          key={s.id}
          onClick={() => onSelect(s.id)}
          className="w-full flex items-center justify-between bg-white border border-slate-200 rounded-lg px-4 py-3 text-left hover:border-indigo-300 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <FileText size={16} className="text-slate-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{s.fileName}</p>
              <p className="text-xs text-slate-400">
                {s.questionCount} questions · {s.experienceLevel} · {(s.difficulty || "medium")} · {new Date(s.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-300 shrink-0" />
        </button>
      ))}
    </div>
  );
}
