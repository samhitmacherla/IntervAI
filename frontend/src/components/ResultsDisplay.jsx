import { ArrowLeft, BarChart3, BookOpen, CheckCircle2, Download, RotateCcw, Target, Trophy, TrendingDown } from "lucide-react";

const labels = { "skill-based": "Skill-based", "project-based": "Project-based", behavioral: "HR" };

function scoreColor(score) {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  return "text-rose-600";
}

export default function ResultsDisplay({
  session,
  overallScore,
  technicalScore,
  behavioralScore,
  categoryScores,
  weakAreas,
  onDownloadPDF,
  onStartOver,
  onPracticeWeakAreas,
  practiceLoading,
  practiceError,
}) {
  const level = overallScore >= 80 ? "Excellent" : overallScore >= 60 ? "Good progress" : "Keep practicing";

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <button onClick={onStartOver} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900">
        <ArrowLeft size={16} /> Back to dashboard
      </button>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
        <section className="rounded-3xl bg-slate-950 p-7 text-white sm:p-9">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-300">Interview complete</p>
          <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className={`text-7xl font-black tracking-tight ${overallScore >= 80 ? "text-emerald-400" : overallScore >= 60 ? "text-amber-400" : "text-rose-400"}`}>{overallScore}%</p>
              <p className="mt-2 text-xl font-bold">{level}</p>
              <p className="mt-2 max-w-lg text-sm leading-6 text-slate-300">Your score combines answer quality and MCQ correctness. Use the category breakdown to decide what to practice next.</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-5 sm:min-w-48">
              <p className="text-xs text-slate-400">Interview difficulty</p>
              <p className="mt-1 text-lg font-bold capitalize">{session?.difficulty || "medium"}</p>
              <p className="mt-4 text-xs text-slate-400">Question blueprint</p>
              <p className="mt-1 text-sm font-semibold">8 Skills · 7 Projects · 5 HR</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><BarChart3 size={20} /></div>
            <div><p className="font-bold">Performance snapshot</p><p className="text-xs text-slate-500">Technical vs HR readiness</p></div>
          </div>
          <div className="mt-6 space-y-4">
            {[["Technical", technicalScore], ["HR", behavioralScore]].map(([name, value]) => (
              <div key={name}>
                <div className="mb-1 flex justify-between text-xs font-semibold"><span>{name}</span><span>{value}%</span></div>
                <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-indigo-600" style={{ width: `${value}%` }} /></div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2"><Target size={19} className="text-indigo-600" /><h2 className="font-bold">Category analysis</h2></div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {Object.entries(categoryScores).map(([key, value]) => (
            <div key={key} className="rounded-2xl bg-slate-50 p-5">
              <div className="flex items-start justify-between"><p className="text-sm font-semibold text-slate-700">{labels[key]}</p><span className={`text-xl font-black ${scoreColor(value)}`}>{value}%</span></div>
              <div className="mt-4 h-2 rounded-full bg-slate-200"><div className="h-2 rounded-full bg-indigo-600" style={{ width: `${value}%` }} /></div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-6">
          <div className="flex items-center gap-2"><Trophy size={19} className="text-emerald-600" /><h2 className="font-bold">What went well</h2></div>
          <div className="mt-4 space-y-2 text-sm text-slate-700">
            {Object.entries(categoryScores).filter(([, v]) => v >= 70).map(([key]) => <p key={key}><CheckCircle2 size={15} className="mr-2 inline text-emerald-600" />Strong performance in {labels[key]} questions.</p>)}
            {!Object.values(categoryScores).some(v => v >= 70) && <p>Keep practicing. Your next session is the opportunity to build a stronger baseline.</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-6">
          <div className="flex items-center gap-2"><TrendingDown size={19} className="text-amber-600" /><h2 className="font-bold">Priority practice areas</h2></div>
          <div className="mt-4 space-y-2 text-sm text-slate-700">
            {weakAreas?.length ? weakAreas.map((area) => <p key={area}>• {area}</p>) : <p>No major weak area was detected from this session.</p>}
          </div>
          {weakAreas?.length > 0 && (
            <button disabled={practiceLoading} onClick={onPracticeWeakAreas} className="mt-4 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">
              {practiceLoading ? "Generating..." : "Practice weak areas"}
            </button>
          )}
          {practiceError && <p className="mt-2 text-xs text-rose-600">{practiceError}</p>}
        </div>
      </section>

      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        <button onClick={onDownloadPDF} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700"><Download size={17} /> Download report</button>
        <button onClick={onStartOver} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"><RotateCcw size={17} /> New interview</button>
        <button onClick={() => window.location.assign("/history")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"><BookOpen size={17} /> View history</button>
      </div>
    </main>
  );
}
