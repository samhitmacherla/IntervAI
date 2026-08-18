import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BarChart3, ChevronRight, FileText, Loader2, Trophy, TrendingUp } from "lucide-react";
import { getHistory, getSession } from "../services/api";

const labels = { "skill-based": "Skill", "project-based": "Project", behavioral: "HR" };

function ScoreBadge({ score }) {
  const tone = score >= 80 ? "bg-emerald-50 text-emerald-700" : score >= 60 ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700";
  return <span className={`rounded-full px-3 py-1 text-sm font-black ${tone}`}>{score}%</span>;
}

function Analytics({ analytics }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="rounded-xl bg-slate-50 p-4"><p className="text-xl font-black">{analytics.overallScore}%</p><p className="text-xs text-slate-500">Overall</p></div>
      <div className="rounded-xl bg-slate-50 p-4"><p className="text-xl font-black">{analytics.categoryScores["skill-based"]}%</p><p className="text-xs text-slate-500">Skills</p></div>
      <div className="rounded-xl bg-slate-50 p-4"><p className="text-xl font-black">{analytics.categoryScores["project-based"]}%</p><p className="text-xs text-slate-500">Projects</p></div>
      <div className="rounded-xl bg-slate-50 p-4"><p className="text-xl font-black">{analytics.categoryScores.behavioral}%</p><p className="text-xs text-slate-500">HR</p></div>
    </div>
  );
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState([]);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getHistory().then(setSessions).catch(() => setError("Couldn't load performance history.")).finally(() => setLoading(false));
  }, []);

  const summary = useMemo(() => {
    const scores = sessions.map(s => s.overallScore).filter(v => typeof v === "number");
    return {
      average: scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) : 0,
      best: scores.length ? Math.max(...scores) : 0,
    };
  }, [sessions]);

  async function openSession(id) {
    try { setDetail(await getSession(id)); }
    catch { setError("Couldn't load that interview."); }
  }

  if (detail) {
    return (
      <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
        <button onClick={() => setDetail(null)} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft size={16} /> Back to performance history</button>
        <div className="rounded-3xl bg-slate-950 p-7 text-white">
          <div className="flex flex-col justify-between gap-5 sm:flex-row">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-300">Interview review</p>
              <h1 className="mt-2 text-2xl font-black">{detail.resume?.fileName || "Pasted resume"}</h1>
              <p className="mt-2 text-sm text-slate-400">{new Date(detail.createdAt).toLocaleString()} · {detail.difficulty} difficulty</p>
            </div>
            <div className="text-left sm:text-right"><p className="text-5xl font-black text-indigo-300">{detail.analytics.overallScore}%</p><p className="text-xs text-slate-400">overall performance</p></div>
          </div>
        </div>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5"><Analytics analytics={detail.analytics} /></section>

        <section className="mt-5 space-y-3">
          {detail.questions.map((q, index) => (
            <div key={q.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div><span className="text-xs font-bold text-indigo-600">{String(index+1).padStart(2,"0")} · {labels[q.sub] || q.sub}</span><p className="mt-2 text-sm font-semibold leading-6 text-slate-900">{q.text}</p></div>
                {q.answers?.[0] && <ScoreBadge score={q.answers[0].satisfied ? (q.type === "mcq" ? 100 : 100) : (q.type === "mcq" ? 0 : 40)} />}
              </div>
              {q.answers?.map(a => (
                <div key={a.id} className="mt-4 rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{a.depth ? `Follow-up ${a.depth}` : "Your answer"}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{a.answerText}</p>
                  {a.feedback && <p className="mt-2 text-xs leading-5 text-slate-500">AI feedback: {a.feedback}</p>}
                </div>
              ))}
              {q.suggestedAnswer && <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm leading-6 text-emerald-800"><b>Model answer:</b> {q.suggestedAnswer}</div>}
            </div>
          ))}
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <button onClick={() => window.location.assign("/")} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft size={16} /> Back to dashboard</button>
      <div className="mb-7">
        <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Analytics</p>
        <h1 className="mt-1 text-3xl font-black text-slate-900">Performance history</h1>
        <p className="mt-2 text-sm text-slate-500">Every completed mock interview is saved here so you can track improvement over time.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><BarChart3 className="text-indigo-600" size={19}/><p className="mt-4 text-2xl font-black">{sessions.length}</p><p className="text-sm text-slate-500">Completed interviews</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><TrendingUp className="text-indigo-600" size={19}/><p className="mt-4 text-2xl font-black">{summary.average}%</p><p className="text-sm text-slate-500">Average score</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><Trophy className="text-amber-500" size={19}/><p className="mt-4 text-2xl font-black">{summary.best}%</p><p className="text-sm text-slate-500">Personal best</p></div>
      </div>

      {loading && <div className="flex justify-center py-16"><Loader2 className="animate-spin text-indigo-600" /></div>}
      {error && <p className="mt-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
      {!loading && !sessions.length && !error && <div className="mt-8 rounded-2xl border border-dashed border-slate-300 p-12 text-center"><FileText className="mx-auto text-slate-300" size={30}/><p className="mt-3 font-semibold text-slate-700">No interviews yet</p><p className="mt-1 text-sm text-slate-500">Complete your first mock interview to start building your history.</p></div>}

      <div className="mt-8 space-y-3">
        {sessions.map(s => (
          <button key={s.id} onClick={() => openSession(s.id)} className="w-full rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-indigo-200 hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><FileText size={19}/></div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><p className="truncate font-bold text-slate-900">{s.fileName}</p><ScoreBadge score={s.overallScore}/></div>
                <p className="mt-1 text-xs text-slate-500">{new Date(s.createdAt).toLocaleDateString()} · {s.difficulty} · {s.questionCount} questions</p>
              </div>
              <ChevronRight className="shrink-0 text-slate-300" size={18}/>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
              <span className="rounded-lg bg-slate-50 px-3 py-2 text-slate-600">Skills <b>{s.categoryScores["skill-based"]}%</b></span>
              <span className="rounded-lg bg-slate-50 px-3 py-2 text-slate-600">Projects <b>{s.categoryScores["project-based"]}%</b></span>
              <span className="rounded-lg bg-slate-50 px-3 py-2 text-slate-600">HR <b>{s.categoryScores.behavioral}%</b></span>
            </div>
          </button>
        ))}
      </div>
    </main>
  );
}
