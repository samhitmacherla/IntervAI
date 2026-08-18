import { useState, useRef } from "react";
import { Upload, Loader2, Sparkles, FileText } from "lucide-react";

const SAMPLE_RESUME = `Ananya Rao
B.Tech, Computer Science, VNR VJIET, 2026

SKILLS: Python (2 yrs), React, Node.js, PostgreSQL, Docker, Git

PROJECTS:
- StudyBuddy: A collaborative note-sharing web app built with React and Node.js. Implemented real-time sync using WebSockets and a PostgreSQL backend. Deployed on Railway. Handled auth with JWT.
- Campus Food Delivery: Backend service in Node.js/Express handling order placement, restaurant inventory, and delivery tracking. Used Redis for caching restaurant menus.

EXPERIENCE:
- Summer Intern, Backend Developer, LocalTech Solutions (2 months) - built REST APIs for an internal inventory tool.

Led a 4-member team for the college hackathon, won 2nd place.`;

// Props:
//   onSubmit({ file, text }) -> called when the user clicks "Start mock interview"
//   loading, error -> passed down from the parent page, which owns the upload+generate calls
export default function ResumeUpload({ onSubmit, loading, error }) {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [difficulty, setDifficulty] = useState("medium");
  const inputRef = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    if (f.type !== "application/pdf" && f.type !== "text/plain") {
      alert("Please upload a .pdf or .txt file.");
      return;
    }
    setFile(f);
    setText(""); // file takes priority over pasted text
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <label className="block text-sm font-medium text-slate-700 mb-2">Paste resume text</label>
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setFile(null); // typing takes priority over a previously chosen file
        }}
        placeholder="Paste the candidate's resume text here..."
        rows={10}
        className="w-full border border-slate-300 rounded-lg p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 resize-none"
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`mt-3 flex items-center justify-center gap-2 border-2 border-dashed rounded-lg py-4 text-sm cursor-pointer transition-colors ${
          dragActive ? "border-indigo-400 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-500 hover:border-slate-300"
        }`}
      >
        <Upload size={14} />
        {file ? (
          <span className="flex items-center gap-1">
            <FileText size={12} /> {file.name}
          </span>
        ) : (
          "Drag & drop a PDF or .txt file, or click to browse"
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      <button
        onClick={() => {
          setFile(null);
          setText(SAMPLE_RESUME);
        }}
        className="mt-3 text-sm text-slate-500 hover:text-slate-700 underline decoration-slate-300"
      >
        Use sample resume
      </button>

      <div className="mt-5">
  <label className="block text-sm font-medium text-slate-700 mb-2">
    Interview difficulty
  </label>

  <div className="grid grid-cols-3 gap-2">
    {[
      {
        value: "easy",
        label: "Easy",
        description: "Fundamentals"
      },
      {
        value: "medium",
        label: "Medium",
        description: "Application & reasoning"
      },
      {
        value: "hard",
        label: "Hard",
        description: "Deep technical"
      }
    ].map((level) => (
      <button
        key={level.value}
        type="button"
        onClick={() => setDifficulty(level.value)}
        disabled={loading}
        className={`border rounded-lg px-3 py-3 text-left transition-colors ${
          difficulty === level.value
            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
            : "border-slate-200 text-slate-600 hover:border-slate-300"
        }`}
      >
        <div className="text-sm font-medium">{level.label}</div>
        <div className="text-xs mt-0.5 text-slate-500">
          {level.description}
        </div>
      </button>
    ))}
  </div>
</div>

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

      <button
        onClick={() => onSubmit({ file, text, difficulty })}
        disabled={loading || (!file && !text.trim())}
        className="mt-5 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
        {loading ? "Generating questions..." : "Generate questions"}
      </button>
    </div>
  );
}
