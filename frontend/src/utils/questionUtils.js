export function safeString(value, fallback = "") {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return fallback;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map((item) => safeString(item)).filter(Boolean).join(", ");
  return fallback;
}

export function normalizeInterviewQuestion(question, index = 0) {
  const raw = question && typeof question === "object" ? question : {};
  const sub = ["skill-based", "project-based", "system-design", "behavioral"].includes(raw.sub)
    ? raw.sub
    : "skill-based";

  const text = safeString(raw.text) || safeString(raw.q) || safeString(raw.question) || "Question unavailable";
  const focus = safeString(raw.focus) || safeString(raw.b) || "general";
  const suggestedAnswer = safeString(raw.suggestedAnswer) || safeString(raw.answer) || "";
  const type = raw.type === "mcq" ? "mcq" : "open";
  const difficulty = safeString(raw.difficulty) || safeString(raw.diff) || "medium";
  const sourceType = safeString(raw.sourceType) || (sub === "behavioral" ? "behavioral" : "skill");
  const options = Array.isArray(raw.options) ? raw.options.map((option) => safeString(option)).filter(Boolean) : [];

  return {
    ...raw,
    id: safeString(raw.id) || `q${index + 1}`,
    sub,
    type,
    text,
    q: text,
    focus,
    b: focus,
    difficulty,
    diff: difficulty,
    sourceType,
    options,
    correctOption: safeString(raw.correctOption) || null,
    suggestedAnswer,
  };
}

export function normalizeQuestions(questions) {
  return Array.isArray(questions) ? questions.map(normalizeInterviewQuestion) : [];
}
