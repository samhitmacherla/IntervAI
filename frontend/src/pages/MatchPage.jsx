import { useRef, useState } from "react";
import {
  CheckCircle2,
  FileText,
  Loader2,
  Sparkles,
  Target,
  Upload,
  XCircle,
} from "lucide-react";
import {
  matchResumeToJob,
  uploadResumeFile,
  uploadResumeText,
} from "../services/api";

export default function MatchPage() {
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;

    if (
      file.type !== "application/pdf" &&
      file.type !== "text/plain"
    ) {
      setError("Please upload a PDF or TXT resume.");
      return;
    }

    setError("");
    setResumeFile(file);
    setResumeText("");
  };

  const handleCheckMatch = async () => {
    if (!resumeFile && !resumeText.trim()) {
      setError("Please upload your resume or paste your resume text.");
      return;
    }

    if (!jobDescription.trim()) {
      setError("Please enter the job description.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const uploaded = resumeFile
        ? await uploadResumeFile(resumeFile)
        : await uploadResumeText(resumeText);

      const match = await matchResumeToJob(
        uploaded.resumeId,
        jobDescription
      );

      setResult(match);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Couldn't calculate the match. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const resetResume = () => {
    setResumeFile(null);
    setResumeText("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-slate-50">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
            <Sparkles size={14} />
            Resume Analysis
          </div>

          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Resume–Job Match
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Upload your resume and enter a job description to see how closely
            they match.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Resume */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <FileText size={19} />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Your Resume
                </h2>
                <p className="text-xs text-slate-500">
                  Upload PDF/TXT or paste text
                </p>
              </div>
            </div>

            <textarea
              value={resumeText}
              onChange={(e) => {
                setResumeText(e.target.value);
                setResumeFile(null);
              }}
              placeholder="Paste your resume text here..."
              rows={12}
              className="mt-5 w-full resize-none rounded-xl border border-slate-300 p-3 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />

            <div
              onClick={() => inputRef.current?.click()}
              className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-5 text-sm text-slate-500 transition hover:border-indigo-300 hover:bg-indigo-50"
            >
              <Upload size={16} />

              {resumeFile ? (
                <span className="flex items-center gap-2 font-medium text-slate-700">
                  <FileText size={14} />
                  {resumeFile.name}
                </span>
              ) : (
                "Click to upload PDF or TXT"
              )}

              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.txt"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>

            {(resumeFile || resumeText) && (
              <button
                type="button"
                onClick={resetResume}
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-red-600"
              >
                <XCircle size={14} />
                Clear resume
              </button>
            )}
          </section>

          {/* Job description */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <Target size={19} />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Job Description
                </h2>
                <p className="text-xs text-slate-500">
                  Paste the job requirements
                </p>
              </div>
            </div>

            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              rows={17}
              className="mt-5 w-full resize-none rounded-xl border border-slate-300 p-3 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />

            {error && (
              <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={handleCheckMatch}
              disabled={
                loading ||
                (!resumeFile && !resumeText.trim()) ||
                !jobDescription.trim()
              }
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            >
              {loading ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Checking match...
                </>
              ) : (
                <>
                  <Sparkles size={17} />
                  Check Resume Match
                </>
              )}
            </button>
          </section>
        </div>

        {/* Result */}
        {result && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-500">
                Resume–Job Match
              </p>

              <div className="mt-3 text-6xl font-black text-indigo-600">
                {result.matchPercentage}%
              </div>

              <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                {result.summary}
              </p>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-center gap-2 font-bold text-emerald-700">
                  <CheckCircle2 size={18} />
                  Matched skills
                </div>

                {result.matchedSkills.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {result.matchedSkills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-emerald-700">
                    No strong matches were identified.
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-rose-200 bg-rose-50 p-5">
                <div className="flex items-center gap-2 font-bold text-rose-700">
                  <XCircle size={18} />
                  Missing skills
                </div>

                {result.missingSkills.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {result.missingSkills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-rose-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-rose-700">
                    No major missing requirements were identified.
                  </p>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}