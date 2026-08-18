import ResultsDisplay from "../components/ResultsDisplay";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  RotateCcw,
  Download,
  Target,
  Brain,
  BookOpen,
  Award,
  GraduationCap,
  BriefcaseBusiness,
  Sparkles,
  Loader2,
} from "lucide-react";
import QuestionDisplay from "../components/QuestionDisplay";
import { generatePracticeQuestions, submitAnswer, submitMcqAnswer } from "../services/api";
import { exportInterviewPDF } from "../utils/pdfExport";
import InterviewSidebar from "../components/InterviewSidebar";
import { normalizeQuestions, normalizeInterviewQuestion, safeString } from "../utils/questionUtils";

const MAX_FOLLOWUPS = 2;

const SUBCATEGORY_LABEL = {
  "skill-based": "Skill",
  "project-based": "Project",
  
  behavioral: "HR",
};

const SUBCATEGORY_STYLE = {
  "skill-based": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "project-based": "bg-violet-50 text-violet-700 border-violet-200",
 
  behavioral: "bg-amber-50 text-amber-800 border-amber-200",
};

const SOURCE_LABEL = {
  skill: "Skill",
  project: "Project",
  experience: "Experience",
  certification: "Certification",
  education: "Education",
  behavioral: "HR",
};



function resolveNextDifficulty(currentDifficulty, signal) {
  const levels = ["easy", "medium", "hard"];
  const currentIndex = levels.indexOf(currentDifficulty);
  const index = currentIndex === -1 ? 1 : currentIndex;

  if (signal === "harder") return levels[Math.min(index + 1, levels.length - 1)];
  if (signal === "easier") return levels[Math.max(index - 1, 0)];
  return levels[index];
}

function pickNext(remaining, signal) {
  if (remaining.length === 0) return null;
  let idx = 0;
  if (signal === "harder") {
    idx = remaining.findIndex((q) => q.difficulty === "hard");
    if (idx === -1) idx = remaining.findIndex((q) => q.difficulty === "medium");
    if (idx === -1) idx = 0;
  } else if (signal === "easier") {
    idx = remaining.findIndex((q) => q.difficulty === "easy");
    if (idx === -1) idx = remaining.findIndex((q) => q.difficulty === "medium");
    if (idx === -1) idx = 0;
  }
  const picked = remaining[idx];
  const rest = remaining.slice(0, idx).concat(remaining.slice(idx + 1));
  return { picked, rest };
}

function scoreEntry(entry) {
  if (entry.skipped) return null;

  if (entry.type === "mcq") {
    return entry.correct ? 100 : 0;
  }

  const score = Number(entry.score);

  if (!Number.isFinite(score)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}
function scoreEntries(entries) {
  const scored = entries.map(scoreEntry).filter((value) => value != null);
  if (!scored.length) return 0;
  return Math.round(scored.reduce((sum, value) => sum + value, 0) / scored.length);
}

function categoryScore(entries, sub) {
  return scoreEntries(entries.filter((entry) => entry.sub === sub));
}

function getWeakAreas(entries) {
  const counts = new Map();
  entries.forEach((entry) => {
    const weak = entry.skipped || (entry.type === "mcq" ? !entry.correct : entry.satisfied === false);
    if (!weak) return;
    const focus = entry.focus?.trim();
    if (!focus || focus.toLowerCase() === "general") return;
    counts.set(focus, (counts.get(focus) || 0) + 1);
  });

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([focus]) => focus);
}

function coverageCount(session, sourceType) {
  return (session.questions || []).filter((q) => q.sourceType === sourceType).length;
}

function ResumeCoverage({ session }) {
  const data = session.extractedData || {};
  const items = [
    { label: "Skills", value: data.skills?.length || 0, questions: coverageCount(session, "skill"), icon: Brain },
    { label: "Projects", value: data.projects?.length || 0, questions: coverageCount(session, "project"), icon: Target },
    { label: "Experience", value: data.experience ? 1 : 0, questions: coverageCount(session, "experience"), icon: BriefcaseBusiness },
    { label: "Certifications", value: data.certifications?.length || 0, questions: coverageCount(session, "certification"), icon: Award },
    { label: "Education", value: data.education ? 1 : 0, questions: coverageCount(session, "education"), icon: GraduationCap },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={15} className="text-indigo-600" />
        <p className="text-sm font-medium text-slate-800">Resume intelligence</p>
      </div>
      <p className="text-xs text-slate-500 mb-3">
        The interview was generated from the candidate's actual resume details rather than generic topics.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {items.map(({ label, value, questions, icon: Icon }) => (
          <div key={label} className="rounded-lg border border-slate-100 bg-slate-50 p-2.5">
            <Icon size={14} className="text-slate-500 mb-1.5" />
            <p className="text-xs font-medium text-slate-700">{label}</p>
            <p className="text-xs text-slate-400">{value} found · {questions} Q</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function InterviewBlueprint({ session }) {
  const technical = session.questions.filter((q) => q.sub !== "behavioral").length;
  const behavioral = session.questions.filter((q) => q.sub === "behavioral").length;
  const mcq = session.questions.filter((q) => q.type === "mcq").length;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen size={15} className="text-indigo-600" />
        <p className="text-sm font-medium text-slate-800">Interview blueprint</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
        <div className="bg-slate-50 rounded-lg p-2.5">
          <p className="text-lg font-semibold text-slate-800">{technical}</p>
          <p className="text-xs text-slate-500">Technical</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-2.5">
          <p className="text-lg font-semibold text-slate-800">{behavioral}</p>
          <p className="text-xs text-slate-500">Behavioral</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-2.5">
          <p className="text-lg font-semibold text-slate-800">{mcq}</p>
          <p className="text-xs text-slate-500">MCQs</p>
        </div>
        <div className="bg-indigo-50 rounded-lg p-2.5">
          <p className="text-sm font-semibold text-indigo-700 capitalize">{session.difficulty || "medium"}</p>
          <p className="text-xs text-indigo-600">Difficulty</p>
        </div>
      </div>
    </div>
  );
}

export default function QuestionsPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const session = state?.session;
  const practiceMode = !!session?.practice;
  const safeSession = session ? { ...session, questions: normalizeQuestions(session.questions || []) } : null;

  const [remaining, setRemaining] = useState([]);
  const [current, setCurrent] = useState(null);
  const [askedCount, setAskedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [showBehavioralBanner, setShowBehavioralBanner] = useState(false);
  const [complete, setComplete] = useState(false);
  const [sessionLog, setSessionLog] = useState([]);
  const [followUpDepth, setFollowUpDepth] = useState(0);
  const [topicHistory, setTopicHistory] = useState([]);
  const [draft, setDraft] = useState("");
  const [draftError, setDraftError] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedbackResult, setFeedbackResult] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [mcqLoading, setMcqLoading] = useState(false);
  const [mcqResult, setMcqResult] = useState(null);
  const [practiceLoading, setPracticeLoading] = useState(false);
  const [practiceError, setPracticeError] = useState("");

  useEffect(() => {
    if (!safeSession?.questions?.length) return;
    const normalizedQuestions = safeSession.questions;
    const [first, ...rest] = normalizedQuestions;
    setCurrent(first);
    setRemaining(rest);
    setAskedCount(1);
    setTotalCount(normalizedQuestions.length);
    setFollowUpDepth(0);
    setTopicHistory([]);
    setShowBehavioralBanner(first.sub === "behavioral");
    setComplete(false);
    setSessionLog([]);
  }, [session]);

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-16 text-center">
        <p className="mb-4 text-sm text-slate-500">No active interview session. Start one from Home.</p>
        <button onClick={() => navigate("/")} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700">
          Go to Dashboard
        </button>
      </div>
    );
  }

  const startPoolQuestion = (q, announceBehavioral) => {
    setCurrent(normalizeInterviewQuestion(q));
    setFollowUpDepth(0);
    setTopicHistory([]);
    setShowBehavioralBanner(!!announceBehavioral);
    setSelectedOption(null);
    setMcqResult(null);
  };

  const advanceOrFinish = (signal) => {
    const next = pickNext(remaining, signal);
    if (!next) {
      setComplete(true);
      return;
    }
    const enteringBehavioral = current.sub !== "behavioral" && next.picked.sub === "behavioral";
    setRemaining(next.rest);
    startPoolQuestion(next.picked, enteringBehavioral);
    setAskedCount((c) => c + 1);
  };

  const handleSubmit = async () => {
    if (!draft.trim()) {
      setDraftError("Type an answer first");
      return;
    }
    setDraftError("");
    setLoading(true);
    try {
      const result = await submitAnswer({
        questionId: current.id,
        exchangeDepth: followUpDepth,
        exchangeText: current.text,
        answerText: draft.trim(),
        topicHistory,
        sub: current.sub,
        difficulty: current.difficulty,
      });
      setFeedbackResult(result);
    } catch (err) {
      console.error(err);
      setDraftError(err.response?.data?.error || "Feedback failed — try submitting again");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    setSessionLog((log) => [
      ...log,
      {
        sub: current.sub,
        type: current.type,
        difficulty: current.difficulty,
        question: current.text,
        answer: null,
        skipped: true,
        focus: current.focus,
        sourceType: current.sourceType,
        suggestedAnswer: current.suggestedAnswer,
        ...(current.type === "mcq"
          ? { options: current.options, correctOption: current.correctOption }
          : {}),
      },
    ]);

    setDraft("");
    setDraftError("");
    setFeedbackResult(null);
    setSelectedOption(null);
    setMcqResult(null);
    advanceOrFinish("same");
  };

  const handleNext = () => {
    const satisfied = feedbackResult?.satisfied;
    const signal = feedbackResult?.nextDifficulty || "same";
    const answeredEntry = {
  question: current.text,
  answer: draft.trim(),
  feedback: feedbackResult.feedback,
  score: Number(feedbackResult.score),
};
    const newHistory = [...topicHistory, answeredEntry];

    setSessionLog((log) => [
      ...log,
      {
        sub: current.sub,
        type: "open",
        difficulty: current.difficulty,
        question: current.text,
        answer: draft.trim(),
        feedback: feedbackResult.feedback,
score: Number(feedbackResult.score),
satisfied: feedbackResult.satisfied,
focus: current.focus,
        sourceType: current.sourceType,
        suggestedAnswer: current.suggestedAnswer,
        isFollowUp: followUpDepth > 0,
      },
    ]);

    setDraft("");
    setDraftError("");
    setFeedbackResult(null);

    const shouldFollowUp =
      satisfied === false &&
      followUpDepth < MAX_FOLLOWUPS &&
      feedbackResult?.followUpQuestion;

    if (shouldFollowUp) {
      const followUpQuestion = normalizeInterviewQuestion({
        id: `${current.id}-f${followUpDepth + 1}`,
        sub: current.sub,
        difficulty: resolveNextDifficulty(current.difficulty, signal),
        type: "open",
        text: safeString(feedbackResult.followUpQuestion),
        focus: safeString(current.focus),
        sourceType: safeString(current.sourceType),
        suggestedAnswer: safeString(current.suggestedAnswer),
      });
      setTopicHistory(newHistory);
      setFollowUpDepth((d) => d + 1);
      setCurrent(followUpQuestion);
      setTotalCount((t) => t + 1);
      setAskedCount((c) => c + 1);
      setShowBehavioralBanner(false);
      return;
    }

    advanceOrFinish(signal);
  };

  const handleMcqSelect = async (opt, submitNow) => {
    if (!submitNow) {
      setSelectedOption(opt);
      return;
    }
    if (!opt) return;
    setMcqLoading(true);
    try {
      const result = await submitMcqAnswer({ questionId: current.id, selectedOption: opt });
      setMcqResult(result);
    } catch (err) {
      console.error(err);
      setDraftError(err.response?.data?.error || "Couldn't check this answer — try again.");
    } finally {
      setMcqLoading(false);
    }
  };

  const handleMcqNext = () => {
    setSessionLog((log) => [
      ...log,
      {
        sub: current.sub,
        type: "mcq",
        difficulty: current.difficulty,
        question: current.text,
        focus: current.focus,
        sourceType: current.sourceType,
        suggestedAnswer: current.suggestedAnswer,
        options: current.options,
        correctOption: current.correctOption,
        selectedOption,
        correct: mcqResult.correct,
        feedback: mcqResult.feedback,
        satisfied: mcqResult.correct,
      },
    ]);

    advanceOrFinish(mcqResult.correct ? "harder" : "easier");
  };

  const startWeakAreaPractice = async () => {
    const weakAreas = getWeakAreas(sessionLog);
    if (!weakAreas.length || !session.resumeId) return;
    setPracticeLoading(true);
    setPracticeError("");
    try {
      const practiceSession = await generatePracticeQuestions({
        resumeId: session.resumeId,
        weakAreas,
      });
      navigate("/questions", { state: { session: practiceSession } });
    } catch (err) {
      setPracticeError(err.response?.data?.error || "Couldn't create targeted practice.");
    } finally {
      setPracticeLoading(false);
    }
  };

 if (complete) {
  const answered = sessionLog.filter((entry) => !entry.skipped);
  const skippedCount = sessionLog.filter((entry) => entry.skipped).length;
  const overallScore = scoreEntries(sessionLog);
  const technicalScore = scoreEntries(sessionLog.filter((entry) => entry.sub !== "behavioral"));
  const behavioralScore = categoryScore(sessionLog, "behavioral");
  const weakAreas = getWeakAreas(sessionLog);

  const categoryScores = {
    "skill-based": categoryScore(sessionLog, "skill-based"),
    "project-based": categoryScore(sessionLog, "project-based"),
     behavioral: categoryScore(sessionLog, "behavioral"),
  };

  return (
    <ResultsDisplay
      sessionLog={sessionLog}
      session={safeSession}
      overallScore={overallScore}
      technicalScore={technicalScore}
      behavioralScore={behavioralScore}
      weakAreas={weakAreas}
      practiceMode={practiceMode}
      onDownloadPDF={() => exportInterviewPDF({ session, sessionLog })}
      onStartOver={() => navigate("/")}
      onPracticeWeakAreas={startWeakAreaPractice}
      practiceLoading={practiceLoading}
      practiceError={practiceError}
      categoryScores={categoryScores}
    />
  );
}

  if (!current) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-16 text-center">
        <p className="text-sm text-slate-500">Preparing your questions...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <InterviewSidebar practiceMode={practiceMode} resumeName={safeString(session.fileName) || "Resume uploaded for this session"} />
      <div className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
          <div>
            <p className="text-sm font-black text-slate-900">{practiceMode ? "Targeted Practice" : "Interview in Progress"}</p>
            <p className="hidden text-xs text-slate-500 sm:block">{practiceMode ? "Practice questions focused on your weak areas" : `${session.difficulty || "medium"} difficulty · Resume-based interview`}</p>
          </div>
          <button onClick={() => navigate("/")} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50">
            <RotateCcw size={14} /> {practiceMode ? "End Practice" : "End Interview"}
          </button>
        </header>

        <main className="mx-auto min-h-[calc(100vh-64px)] w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">{practiceMode ? "Weak Area Practice" : "Mock Interview"}</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">{practiceMode ? "Targeted Practice" : "AI Interview"}</h1>
              <p className="mt-1 text-sm text-slate-500">{practiceMode ? "New questions focused on your weak areas to improve your score." : "Answer naturally. The AI interviewer will evaluate your response and guide the next question."}</p>
            </div>
            <div className="hidden rounded-xl border border-slate-200 bg-white px-4 py-2 text-right shadow-sm sm:block">
              <p className="text-xs text-slate-400">Question</p>
              <p className="text-sm font-black text-slate-900">{askedCount} / {totalCount}</p>
            </div>
          </div>

          {!practiceMode && session.extractedData && (
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Resume context</p><p className="mt-1 text-sm text-slate-600">{session.extractedData.experience || "Questions are grounded in the uploaded resume."}</p></div>
                <div className="flex flex-wrap gap-1.5">{session.extractedData.skills?.slice(0, 8).map((skill, i) => <span key={i} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">{skill}</span>)}</div>
              </div>
            </div>
          )}

          <QuestionDisplay
            current={current}
            askedCount={askedCount}
            totalQuestions={totalCount}
            showBehavioralBanner={showBehavioralBanner}
            draft={draft}
            onDraftChange={setDraft}
            draftError={draftError}
            loading={loading}
            feedbackResult={feedbackResult}
            onSubmit={handleSubmit}
            onNext={handleNext}
            onSkip={handleSkip}
            isLastQuestion={remaining.length === 0}
            selectedOption={selectedOption}
            onMcqSelect={handleMcqSelect}
            mcqLoading={mcqLoading}
            mcqResult={mcqResult}
            onMcqNext={handleMcqNext}
          />
        </main>
      </div>
    </div>
  );
}
