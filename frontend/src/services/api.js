// Single axios instance + one function per backend endpoint.
// Every component talks to the API through this file only.

import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// Upload a File object (pdf/txt)
export async function uploadResumeFile(file) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post("/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data; // { resumeId, text }
}

// Upload pasted resume text
export async function uploadResumeText(text) {
  const { data } = await api.post("/upload", { text });
  return data; // { resumeId, text }
}

// Generate the 20-question session for an uploaded resume
export async function generateSession(resumeId, difficulty = "medium", mode = "mock") {
  const { data } = await api.post("/generate", {
    resumeId,
    difficulty,
    mode,
  });

  return data;
}
// Submit one OPEN-question answer (main question or follow-up) and get feedback back.
// sub/difficulty are included so the backend can still score a follow-up question
// even though follow-ups aren't backed by a row in the database.
export async function submitAnswer({ questionId, exchangeDepth, exchangeText, answerText, topicHistory, sub, difficulty }) {
  const { data } = await api.post("/generate/feedback", {
    questionId,
    exchangeDepth,
    exchangeText,
    answerText,
    topicHistory,
    sub,
    difficulty,
  });
  return data; // { feedback, satisfied, nextDifficulty, followUpQuestion }
}

// Generate five new questions targeted at the candidate's weak areas.
export async function generatePracticeQuestions({ resumeId, weakAreas }) {
  const { data } = await api.post("/generate/practice", { resumeId, weakAreas });
  return data;
}

// Submit one MCQ selection — checked deterministically server-side, no LLM call
export async function submitMcqAnswer({ questionId, selectedOption }) {
  const { data } = await api.post("/generate/mcq-answer", { questionId, selectedOption });
  return data; // { correct, correctOption, suggestedAnswer, feedback }
}

// List past sessions
export async function getHistory() {
  const { data } = await api.get("/history");
  return data;
}

// Full detail for one past session
export async function getSession(id) {
  const { data } = await api.get(`/history/${id}`);
  return data;
}

export default api;
