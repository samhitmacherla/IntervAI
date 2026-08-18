import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown, CheckCircle2, BookOpen, Brain, Briefcase, MessageCircle, Sparkles, Loader2 } from "lucide-react";
import { generateSession } from "../services/api";

const labels = { "skill-based": "Skill", "project-based": "Project", behavioral: "HR" };
const icons = { "skill-based": Brain, "project-based": Briefcase, behavioral: MessageCircle };

export default function QuestionBankPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const session = state?.session;
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState("");

  if (!session?.questions?.length) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-14 text-center">
        <p className="text-slate-500">No question bank is active.</p>
        <button onClick={() => navigate("/")} className="mt-4 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white">Back to dashboard</button>
      </main>
    );
  }

  const questions = session.questions.filter((q) => filter === "all" || q.sub === filter);

  const startMock = async () => {
    if (!session.resumeId) {
      navigate("/");
      return;
    }
    setStarting(true);
    setStartError("");
    try {
      const mockSession = await generateSession(session.resumeId, session.difficulty || "medium", "mock");
      navigate("/questions", { state: { session: mockSession } });
    } catch (err) {
      setStartError(err.response?.data?.error || "Couldn't prepare the mock interview. Please try again.");
    } finally {
      setStarting(false);
    }
  };

  const counts = {
    "skill-based": session.questions.filter(q => q.sub === "skill-based").length,
    "project-based": session.questions.filter(q => q.sub === "project-based").length,
    behavioral: session.questions.filter(q => q.sub === "behavioral").length,
  };

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
      <button onClick={() => navigate("/")} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900">
        <ArrowLeft size={16} /> Back to dashboard
      </button>

      <div className="rounded-3xl bg-slate-950 p-7 text-white sm:p-9">
        <div className="flex flex-col justify-between gap-5 sm:flex-row">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-300"><Sparkles size={14} /> Personalized question bank</span>
            <h1 className="mt-2 text-3xl font-black">Study before you interview.</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Every question is generated from your resume. Expand a card to reveal the model answer and the resume detail being tested.</p>
          </div>
          <button disabled={starting} onClick={startMock} className="self-start rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-bold hover:bg-indigo-400 disabled:opacity-60">
            {starting ? <><Loader2 size={15} className="mr-2 inline animate-spin" />Preparing...</> : "Start mock interview"}
          </button>
        </div>
        {startError && <p className="mt-4 rounded-xl bg-rose-500/10 px-3 py-2 text-xs text-rose-200">{startError}</p>}
        <div className="mt-7 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-white/5 p-3"><p className="text-xl font-bold">{counts["skill-based"]}</p><p className="text-xs text-slate-400">Skill</p></div>
          <div className="rounded-xl bg-white/5 p-3"><p className="text-xl font-bold">{counts["project-based"]}</p><p className="text-xs text-slate-400">Project</p></div>
          <div className="rounded-xl bg-white/5 p-3"><p className="text-xl font-bold">{counts.behavioral}</p><p className="text-xs text-slate-400">HR</p></div>
        </div>
      </div>

      <div className="sticky top-[73px] z-20 mt-6 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-sm backdrop-blur">
        <div className="grid grid-cols-4 gap-1">
          {[["all", "All 20"], ["skill-based", `Skills ${counts["skill-based"]}`], ["project-based", `Projects ${counts["project-based"]}`], ["behavioral", `HR ${counts.behavioral}`]].map(([value, text]) => (
            <button key={value} onClick={() => setFilter(value)} className={`rounded-xl px-2 py-2.5 text-xs font-semibold sm:text-sm ${filter === value ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-100"}`}>{text}</button>
          ))}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {questions.map((q, i) => {
          const Icon = icons[q.sub] || BookOpen;
          const isOpen = open === q.id;
          return (
            <div key={q.id} className={`overflow-hidden rounded-2xl border bg-white transition ${isOpen ? "border-indigo-200 shadow-md" : "border-slate-200"}`}>
              <button onClick={() => setOpen(isOpen ? null : q.id)} className="w-full p-5 text-left">
                <div className="flex gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><span className="text-xs font-bold">{String(i + 1).padStart(2, "0")}</span></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700"><Icon size={12} /> {labels[q.sub]}</span>
                      <span className="text-xs text-slate-400">{q.difficulty}</span>
                      {q.type === "mcq" && <span className="text-xs font-semibold text-emerald-600">MCQ</span>}
                    </div>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">{q.text}</p>
                  </div>
                  <ChevronDown size={18} className={`mt-1 shrink-0 text-slate-400 transition ${isOpen ? "rotate-180" : ""}`} />
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-slate-100 bg-slate-50/70 p-5">
                  {q.focus && <p className="mb-3 text-xs font-semibold text-slate-500">Resume detail: <span className="font-medium text-slate-700">{q.focus}</span></p>}
                  {q.type === "mcq" && (
                    <div className="mb-4 grid gap-2 sm:grid-cols-2">
                      {(q.options || []).map((option) => (
                        <div key={option} className={`rounded-xl border px-3 py-2.5 text-sm ${option === q.correctOption ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-600"}`}>
                          {option === q.correctOption && <CheckCircle2 size={14} className="mr-1 inline" />}
                          {option}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="rounded-2xl border border-indigo-100 bg-white p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Model answer</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{q.suggestedAnswer || "No model answer was generated for this question."}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
