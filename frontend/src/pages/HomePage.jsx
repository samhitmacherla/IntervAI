import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, BarChart3, BookOpen, Brain, CheckCircle2, Clock3, FileText,
  History as HistoryIcon, MessageSquare, Play, Sparkles, Target, Trophy, X
} from "lucide-react";
import ResumeUpload from "../components/ResumeUpload";
import { generateSession, getHistory, uploadResumeFile, uploadResumeText } from "../services/api";

const modes = [
  {
    id: "mock",
    title: "Mock Interview",
    description: "Simulate a real interview. Answer questions, get AI feedback and a final performance score.",
    icon: Play,
    badge: "AI Interview",
  },
  {
    id: "bank",
    title: "Question Bank",
    description: "Browse resume-based questions with model answers. Learn first, then practice.",
    icon: BookOpen,
    badge: "Learn & Prepare",
  },
];

function Metric({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Icon size={19} />
        </div>
        <span className="text-xs font-medium text-slate-400">{hint}</span>
      </div>
      <p className="mt-4 text-2xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [mode, setMode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getHistory().then(setHistory).catch(() => setHistory([]));
  }, []);

  const stats = useMemo(() => {
    const scores = history.map((h) => h.overallScore).filter((v) => typeof v === "number");
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    return { count: history.length, avg, best: scores.length ? Math.max(...scores) : 0 };
  }, [history]);

  const handleSubmit = async ({ file, text, difficulty }) => {
    setError("");
    setLoading(true);
    try {
      const { resumeId } = file ? await uploadResumeFile(file) : await uploadResumeText(text);
      const session = await generateSession(resumeId, difficulty, mode);
      if (mode === "bank") {
        navigate("/question-bank", { state: { session } });
      } else {
        navigate("/questions", { state: { session } });
      }
    } catch (err) {
      setError(err.response?.data?.error || "We couldn't prepare your session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <section className="relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(99,102,241,.28),transparent_35%),radial-gradient(circle_at_85%_30%,rgba(14,165,233,.18),transparent_30%)]" />
        <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-400/10 px-3 py-1.5 text-xs font-semibold text-indigo-200">
              <Sparkles size={14} /> Resume-powered interview preparation
            </span>
            <h1 className="mt-6 text-4xl font-black tracking-tight text-white sm:text-6xl">
              Turn your resume into your <span className="text-indigo-300">next interview win.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Choose how you want to prepare. Get a realistic AI mock interview or study a personalized question bank with model answers.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-300">
              <span className="rounded-lg bg-white/5 px-3 py-2">8 Skill questions</span>
              <span className="rounded-lg bg-white/5 px-3 py-2">7 Project questions</span>
              <span className="rounded-lg bg-white/5 px-3 py-2">5 HR questions</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold text-indigo-600">YOUR WORKSPACE</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">What do you want to do?</h2>
          </div>
          <button onClick={() => navigate("/history")} className="hidden items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600 sm:flex">
            <HistoryIcon size={16} /> Performance history
          </button>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {modes.map(({ id, title, description, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => { setMode(id); setError(""); }}
              className="group rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Icon size={23} />
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">{badge}</span>
              </div>
              <h3 className="mt-5 text-xl font-bold text-slate-900">{title}</h3>
              <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">{description}</p>
              <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">
                Continue <ArrowRight size={16} className="transition group-hover:translate-x-1" />
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Metric icon={Target} label="Interviews completed" value={stats.count} hint="ALL TIME" />
          <Metric icon={BarChart3} label="Average performance" value={`${stats.avg}%`} hint="SCORE" />
          <Metric icon={Trophy} label="Best performance" value={`${stats.best}%`} hint="PERSONAL BEST" />
          <Metric icon={Clock3} label="Question blueprint" value="20" hint="PER SESSION" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-14 sm:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <Brain className="text-indigo-600" size={22} />
            <h3 className="mt-4 font-bold">Resume-grounded</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">Questions use the skills, projects, education and experience actually found in your resume.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <MessageSquare className="text-indigo-600" size={22} />
            <h3 className="mt-4 font-bold">Instant AI feedback</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">Every mock-interview answer gets concise feedback and, when useful, a focused follow-up.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <FileText className="text-indigo-600" size={22} />
            <h3 className="mt-4 font-bold">Progress tracking</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">Review previous sessions, category scores, answers and improvement areas from one history page.</p>
          </div>
        </div>
      </section>

      {mode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">{mode === "mock" ? "Step 1 · Mock interview" : "Step 1 · Question bank"}</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">Add your resume</h2>
                <p className="mt-1 text-sm text-slate-500">We'll personalize all 20 questions from it.</p>
              </div>
              <button onClick={() => setMode(null)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={20} /></button>
            </div>
            <div className="p-6">
              <ResumeUpload onSubmit={handleSubmit} loading={loading} error={error} />
            </div>
          </div>
        </div>
      )}

      <footer className="border-t border-slate-200 bg-white py-7 text-center text-xs text-slate-400">
        InterviewAI · Resume-powered preparation workspace
      </footer>
    </main>
  );
}
