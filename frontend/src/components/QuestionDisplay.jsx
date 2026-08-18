import { ArrowRight, Check, Loader2, Minus, Send, TrendingDown, TrendingUp, Users, X } from "lucide-react";
import { safeString } from "../utils/questionUtils";

const labels = {
  "skill-based": "Skill-Based",
  "project-based": "Project-Based",
  "system-design": "System Design",
  behavioral: "HR",
};

const badge = {
  "skill-based": "bg-indigo-50 text-indigo-700 border-indigo-100",
  "project-based": "bg-violet-50 text-violet-700 border-violet-100",
  "system-design": "bg-blue-50 text-blue-700 border-blue-100",
  behavioral: "bg-amber-50 text-amber-700 border-amber-100",
};

function Progress({ askedCount, totalQuestions, current }) {
  const progress = totalQuestions ? Math.min((askedCount / totalQuestions) * 100, 100) : 0;
  return (
    <div className="mb-5">
      <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-600">
        <span>Question {askedCount} of {totalQuestions}</span>
        <span className="capitalize text-slate-400">{current.type === "mcq" ? "Multiple Choice" : safeString(current.difficulty, "medium")}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

function Meta({ current }) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      <span className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${badge[current.sub] || badge["skill-based"]}`}>{labels[safeString(current.sub)] || safeString(current.sub, "Skill-Based")}</span>
      {current.focus && current.focus.toLowerCase() !== "general" && (
        <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">Based on: {safeString(current.focus)}</span>
      )}
    </div>
  );
}

function FeedbackPanel({ feedbackResult, current }) {
  return (
    <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-50 text-indigo-600"><span className="text-lg">✦</span></div>
        <div><p className="font-bold text-slate-900">AI Interviewer</p><p className="text-xs text-slate-500">Real-time guidance</p></div>
      </div>
      {!feedbackResult ? (
        <div className="mt-6 space-y-4 text-sm text-slate-600">
          <p>Take your time and think step by step.</p>
          <p>Structure your answer clearly and connect it to your resume.</p>
          <div className="border-t border-slate-100 pt-4">
            <p className="mb-3 font-semibold text-slate-800">After you answer:</p>
            <p className="mb-2">✓ AI will evaluate your response</p>
            <p className="mb-2">✓ You'll get targeted feedback</p>
            <p>✓ You can continue to the next question</p>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
            {feedbackResult.nextDifficulty === "harder" && <TrendingUp size={14} className="text-emerald-600" />}
            {feedbackResult.nextDifficulty === "easier" && <TrendingDown size={14} className="text-amber-600" />}
            {feedbackResult.nextDifficulty === "same" && <Minus size={14} />}
            Interviewer feedback
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-700">{safeString(feedbackResult.feedback)}</p>
        </div>
      )}
    </aside>
  );
}

export default function QuestionDisplay({
  current, askedCount, totalQuestions, showBehavioralBanner,
  draft, onDraftChange, draftError, loading, feedbackResult, onSubmit, onNext, onSkip, isLastQuestion,
  selectedOption, onMcqSelect, mcqLoading, mcqResult, onMcqNext,
}) {
  return (
    <section className="w-full">
      <Progress askedCount={askedCount} totalQuestions={totalQuestions} current={current} />
      {showBehavioralBanner && (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700"><Users size={16} /> Now entering the HR section</div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <Meta current={current} />
          <h1 className="max-w-5xl text-2xl font-bold leading-tight tracking-tight text-slate-900 sm:text-3xl">{safeString(current.text) || safeString(current.q) || "Question unavailable"}</h1>

          {current.type === "mcq" ? (
            <>
              <div className="mt-8 grid gap-3 md:grid-cols-2">
                {(current.options || []).map((opt, i) => {
                  const isSelected = selectedOption === opt;
                  const isCorrect = opt === mcqResult?.correctOption;
                  const style = mcqResult
                    ? isCorrect ? "border-emerald-200 bg-emerald-50 text-emerald-800" : isSelected ? "border-rose-200 bg-rose-50 text-rose-800" : "border-slate-200 bg-slate-50 text-slate-500"
                    : isSelected ? "border-indigo-300 bg-indigo-50 text-indigo-800" : "border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50/40";
                  return (
                    <button key={i} onClick={() => !mcqResult && onMcqSelect(opt)} disabled={!!mcqResult || mcqLoading} className={`flex min-h-16 w-full items-center justify-between rounded-2xl border px-5 py-4 text-left text-sm font-semibold transition ${style}`}>
                      <span><span className="mr-3 text-xs text-slate-400">{String.fromCharCode(65 + i)}</span>{safeString(opt)}</span>
                      {mcqResult && isCorrect && <Check size={18} className="text-emerald-600" />}
                      {mcqResult && isSelected && !isCorrect && <X size={18} className="text-rose-600" />}
                    </button>
                  );
                })}
              </div>
              {!mcqResult && (
                <div className="mt-8 flex flex-wrap gap-3">
                  <button onClick={onSkip} className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">Skip Question</button>
                  <button onClick={() => onMcqSelect(selectedOption, true)} disabled={!selectedOption || mcqLoading} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-40"><Send size={16} />{mcqLoading ? "Checking..." : "Submit Answer"}</button>
                </div>
              )}
              {mcqResult && <div className="mt-8 rounded-2xl bg-slate-50 p-5"><p className={`text-sm font-bold ${mcqResult.correct ? "text-emerald-700" : "text-rose-700"}`}>{mcqResult.correct ? "Correct answer" : "Not quite"}</p><p className="mt-2 text-sm leading-6 text-slate-700">{safeString(mcqResult.suggestedAnswer)}</p><button onClick={onMcqNext} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white">{isLastQuestion ? "Finish" : "Next Question"}<ArrowRight size={15} /></button></div>}
            </>
          ) : (
            <>
              <div className="mt-8">
                <label className="mb-2 block text-sm font-semibold text-slate-800">Your Answer</label>
                <textarea value={draft} onChange={(e) => onDraftChange(e.target.value)} rows={9} placeholder="Type your answer here..." disabled={!!feedbackResult} className="w-full resize-y rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-7 text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50" />
                {draftError && <p className="mt-2 text-sm font-medium text-rose-600">{draftError}</p>}
              </div>
              {!feedbackResult && <div className="mt-5 flex flex-wrap gap-3"><button onClick={onSkip} className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">Skip Question</button><button onClick={onSubmit} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50">{loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}{loading ? "Getting Feedback..." : "Submit Answer"}</button></div>}
              {feedbackResult && <button onClick={onNext} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white">{isLastQuestion && feedbackResult.satisfied !== false ? "Finish Interview" : "Next Question"}<ArrowRight size={15} /></button>}
            </>
          )}
        </section>

        <FeedbackPanel feedbackResult={feedbackResult} current={current} />
      </div>
    </section>
  );
}
