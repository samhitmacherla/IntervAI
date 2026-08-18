// All calls to the Groq API live here.
// 1. generateQuestions -> resume analysis + 20 personalized questions: 8 skill-based, 7 project-based, 5 HR/behavioral
// 2. generateFeedback -> concise feedback + adaptive follow-up
// 3. generatePracticeQuestions -> 5 new questions targeted at weak areas

const Groq = require("groq-sdk");
const { GROQ_API_KEY } = require("../config/env");

const client = new Groq({ apiKey: GROQ_API_KEY });
const MODEL_NAME = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

const SUB_TO_CATEGORY = {
  "skill-based": "technical",
  "project-based": "technical",
 
  behavioral: "hr",
};

const SUB_TO_DIFFICULTY = {
  "skill-based": "easy",
  "project-based": "medium",
 
  behavioral: "medium",
};

function extractJSON(text) {
  let cleaned = text.trim();
  cleaned = cleaned
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/```\s*$/, "");

  const start = cleaned.indexOf("{");
  if (start !== -1) cleaned = cleaned.slice(start);
  const end = cleaned.lastIndexOf("}");
  const attempt = end !== -1 ? cleaned.slice(0, end + 1) : cleaned;

  try {
    return JSON.parse(attempt);
  } catch (e) {
    const lastComplete = cleaned.lastIndexOf("},");
    if (lastComplete === -1) throw e;
    return JSON.parse(cleaned.slice(0, lastComplete + 1) + "]}");
  }
}

async function callGroq(
  prompt,
  maxTokens = 1000,
  systemPrompt = "You are a helpful assistant that outputs strictly valid JSON."
) {
  try {
    const message = await client.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      model: MODEL_NAME,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const text = message.choices[0]?.message?.content;
    if (!text) throw new Error("No text in Groq response");
    return text;
  } catch (err) {
    if (err.status === 429 || err?.error?.code === "rate_limit_exceeded") {
      let retryMinutes = null;
      const retryAfter = err.headers?.get?.("retry-after");

      if (retryAfter) {
        const retrySeconds = Number(retryAfter);
        if (!Number.isNaN(retrySeconds)) {
          retryMinutes = Math.ceil(retrySeconds / 60);
        }
      }

      const rateLimitError = new Error(
        retryMinutes
          ? `AI usage limit reached. Please try again in about ${retryMinutes} minute${retryMinutes === 1 ? "" : "s"}.`
          : "AI usage limit reached. Please try again later."
      );
      rateLimitError.status = 429;
      rateLimitError.code = "RATE_LIMIT_EXCEEDED";
      throw rateLimitError;
    }

    throw err;
  }
}

function normalizeQuestion(q, index, interviewDifficulty = null) {
  const sub = ["skill-based", "project-based",   "behavioral"].includes(q.sub)
    ? q.sub
    : "skill-based";

  return {
    ...q,
    id: q.id || `q${index + 1}`,
    sub,
    type: q.type === "mcq" ? "mcq" : "open",
    options: Array.isArray(q.options) ? q.options : [],
    correctOption: q.correctOption || null,
    text: q.text || q.q || "",
    focus: q.focus || q.b || "general",
    suggestedAnswer: q.suggestedAnswer || "",
    cat: SUB_TO_CATEGORY[sub] || "technical",
    difficulty: q.difficulty || q.diff || interviewDifficulty || SUB_TO_DIFFICULTY[sub] || "medium",
    diff: q.difficulty || q.diff || interviewDifficulty || SUB_TO_DIFFICULTY[sub] || "medium",
    sourceType: q.sourceType || (sub === "behavioral" ? "behavioral" : "skill"),
  };
}

function validateQuestionSet(parsed) {
  const questions = parsed.questions;
 

  if (!Array.isArray(questions) || questions.length !== 20) {
    throw new Error("The AI must return exactly 20 questions. Please generate again.");
  }

  const requiredCounts = {
    "skill-based": 8,
    "project-based": 7,
    behavioral: 5,
  };
  for (const [sub, required] of Object.entries(requiredCounts)) {
    const actual = questions.filter((q) => q.sub === sub).length;
    if (actual !== required) {
      throw new Error(`The AI returned ${actual} ${sub} questions; exactly ${required} are required.`);
    }
  }
  

  const mcqs = questions.filter((q) => q.type === "mcq");

for (const q of mcqs) {
  if (q.sub === "behavioral") {
    throw new Error(
      "MCQs cannot be behavioral questions. Please generate again."
    );
  }

  if (
    !Array.isArray(q.options) ||
    q.options.length !== 4 ||
    !q.correctOption ||
    !q.options.includes(q.correctOption)
  ) {
    throw new Error(
      "Each MCQ must contain exactly 4 options and one correct option. Please generate again."
    );
  }
}

  const counts = {
    "skill-based": questions.filter((q) => q.sub === "skill-based").length,
    "project-based": questions.filter((q) => q.sub === "project-based").length,
    
    behavioral: questions.filter((q) => q.sub === "behavioral").length,
  };

  const behavioralIndex = questions.findIndex(
  (q) => q.sub === "behavioral"
);

if (
  behavioralIndex !== -1 &&
  questions
    .slice(behavioralIndex)
    .some((q) => q.sub !== "behavioral")
) {
  throw new Error(
    "Behavioral questions must appear after all technical questions. Please generate again."
  );
}

  

  return true;
}

async function generateQuestions(resumeText, interviewDifficulty = "medium") {
  const allowedDifficulties = ["easy", "medium", "hard"];

if (!allowedDifficulties.includes(interviewDifficulty)) {
  throw new Error("Invalid interview difficulty.");
}
  const systemPrompt =
    "You are an expert technical interviewer for campus placements. Return ONLY valid raw JSON matching the requested structure.";

  const prompt = `You are analyzing a resume for a campus placement candidate to build a personalized mock interview.

RESUME TEXT:
${resumeText.slice(0, 2200)}

STEP 1 - Determine experience level:
Classify as "experienced" ONLY if the candidate has 1+ years of full-time, non-internship professional work experience. Otherwise classify as "fresher".

STEP 2 - Extract resume data:
- skills: up to 5 technical skills, short strings, taken from the resume
- projects: up to 3 project names, short names only, taken from the resume
- experience: one short sentence summary; null if there is no experience
- education: one short string containing the highest/latest education entry, including degree/institution/year when available; null if unavailable
- certifications: up to 4 certification names, taken from the resume; [] if none
Do not invent any resume detail.

INTERVIEW DIFFICULTY:

The candidate selected "${interviewDifficulty}" as the interview difficulty.

All 20 initial questions must be appropriate for this selected difficulty.

EASY:
Focus on fundamentals, basic understanding, straightforward implementation,
simple project questions, and clear behavioral questions.

MEDIUM:
Focus on practical application, reasoning, implementation choices,
project depth, trade-offs, and moderately challenging behavioral situations.

HARD:
Focus on deep technical understanding, edge cases, trade-offs,
architecture, debugging, project decisions, and challenging behavioral situations.

The selected difficulty applies to the initial 20 questions.
Do not change the required question distribution or MCQ distribution.
Do not make easy questions unnecessarily difficult or hard questions superficial.
Every question must still be grounded in the candidate's actual resume.

STEP 3 - Generate exactly 20 interview questions. Every question must be grounded in a specific detail from the resume. Avoid generic textbook questions.

Each question must include:
- id: q1..q20
- sub: skill-based | project-based |  behavioral
- type: open | mcq
- q: a complete natural interview question, preferably 10-25 words
- b: a 2-4 word description of the specific resume detail being tested
- sourceType: skill | project | experience | certification | education | behavioral
- suggestedAnswer: 2-4 sentences for open questions; 1-2 sentences for MCQ explanation

For MCQs ONLY:
- options: exactly 4 short plausible choices
- correctOption: exactly one option string

Personalization rules:
- Name the actual skill, project, technology, experience, certification, or education detail whenever possible.
- Do not invent technologies, project behavior, certifications, or experience.
- Use certifications and education when they provide meaningful interview material; do not force them into technical questions if the resume has no useful detail.
- Behavioral questions may reference the candidate's education, projects, internship/work, leadership, or achievements instead of being generic HR questions.

BAD: "What is Python?"
GOOD: "How did you use Python in the project listed on your resume, and what problem did it solve?"

Distribution rules:
- ALL candidates: exactly 8 skill-based, exactly 7 project-based, exactly 5 behavioral (HR) questions.
- Do not generate system-design questions in the standard 20-question interview.
- The 5 behavioral questions are the HR section and must appear last.
- Keep the total exactly 20 questions.

MCQ rule:
Include MCQs only when they naturally fit the resume and the question topic.
MCQs may appear in skill-based, project-based 
but never in behavioral questions.

The number of MCQs is flexible. Prioritize question quality and resume
personalization over achieving a fixed MCQ count.

For every MCQ, include exactly 4 plausible options and a correctOption that
exactly matches one of the options.

Ordering rules:
- All technical questions first, starting with an easier skill-based question.
- All behavioral questions last as one block.

Return ONLY this JSON shape:
{"experienceLevel":"fresher","extractedData":{"skills":["..."],"projects":["..."],"experience":"...","education":"...","certifications":["..."]},"questions":[{"id":"q1","sub":"skill-based","type":"open","q":"...","b":"Java OOP","sourceType":"skill","suggestedAnswer":"..."},{"id":"q2","sub":"skill-based","type":"mcq","q":"...","b":"React project","sourceType":"project","options":["...","...","...","..."],"correctOption":"...","suggestedAnswer":"..."}]}`;

  let parsed;
  let lastError;

  // A strict retry makes the generation flow resilient when the model occasionally
  // misses the exact 8/7/5 structure or returns malformed JSON.
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const raw = await callGroq(prompt, 6000, systemPrompt);
      parsed = extractJSON(raw);
      validateQuestionSet(parsed);
      break;
    } catch (err) {
      lastError = err;
      if (err.status === 429 || err.code === "RATE_LIMIT_EXCEEDED") throw err;
    }
  }

  if (!parsed) {
    throw lastError || new Error("The AI could not produce a valid interview set.");
  }

  parsed.questions = parsed.questions.map(
    (q, index) => normalizeQuestion(q, index, interviewDifficulty)
  );
  parsed.extractedData = {
    skills: Array.isArray(parsed.extractedData?.skills) ? parsed.extractedData.skills.slice(0, 5) : [],
    projects: Array.isArray(parsed.extractedData?.projects) ? parsed.extractedData.projects.slice(0, 3) : [],
    experience: parsed.extractedData?.experience || null,
    education: parsed.extractedData?.education || null,
    certifications: Array.isArray(parsed.extractedData?.certifications)
      ? parsed.extractedData.certifications.slice(0, 4)
      : [],
  };
   parsed.difficulty = interviewDifficulty;
  return parsed;
}

async function generateFeedback({ sub, difficulty, exchangeDepth, exchangeText, answerText, topicHistory }) {
  const systemPrompt =
    "You are a strict but fair interviewer giving concise feedback. Return ONLY valid raw JSON.";

  const recentHistory = (topicHistory || []).slice(-2);
  const historyBlock = recentHistory.length
    ? `\nEarlier in this same topic:\n${recentHistory
        .map((h, i) => `Q${i + 1}: ${h.question}\nA${i + 1}: ${h.answer}`)
        .join("\n\n")}`
    : "";

  const prompt = `The interviewer is running a ${sub} topic at ${difficulty} difficulty. This is ${
    exchangeDepth === 0 ? "the opening question" : `follow-up #${exchangeDepth} on that same topic`
  }.${historyBlock}

Current question:
"${exchangeText}"

Candidate answer:
"${answerText}"

First decide whether the answer is a genuine, on-topic attempt. Treat it as invalid if it is empty, keyboard-mashing, random, clearly off-topic, or otherwise not a real attempt.
If invalid: feedback must briefly explain what the answer needed to cover, satisfied=false, nextDifficulty="${difficulty}", followUpQuestion=null.
If valid: give specific feedback in at most 2 sentences, decide whether another probing question is needed, and choose nextDifficulty as easier, same, or harder.
If a follow-up is needed, make it directly connected to the candidate's answer. Otherwise followUpQuestion must be null.
Evaluate the candidate's answer strictly and assign a score from 0 to 100.

Scoring:
90-100 = excellent, accurate, complete, technically strong
75-89 = good, mostly correct with minor gaps
50-74 = partially correct with important gaps
25-49 = weak with major conceptual gaps
0-24 = incorrect, irrelevant, or seriously misunderstood

Do not give points merely because the candidate attempted an answer.
A completely wrong answer must receive a very low score.
The score must be a number from 0 to 100.
 
Return ONLY:
{"score":0,"feedback":"...","satisfied":false,"nextDifficulty":"easier","followUpQuestion":null}`;
  const raw = await callGroq(prompt, 350, systemPrompt);
  return extractJSON(raw);
}

async function generatePracticeQuestions(resumeText, weakAreas = []) {
  const areas = weakAreas.slice(0, 3).join(", ");
  const systemPrompt =
    "You are an expert placement interviewer. Return ONLY valid raw JSON.";

  const prompt = `Create a targeted practice set for a candidate who just completed a resume-based mock interview.

RESUME:
${resumeText.slice(0, 1800)}

WEAK AREAS:
${areas || "General technical fundamentals"}

Generate exactly 5 NEW open-ended questions. Each must be grounded in the resume and specifically target one of the weak areas. Do not repeat obvious wording from the resume or ask generic questions. Each question needs a short 2-4 sentence suggested answer.

Return ONLY:
{"questions":[{"id":"p1","sub":"skill-based","type":"open","q":"...","b":"...","sourceType":"skill","suggestedAnswer":"..."}]}`;

  const raw = await callGroq(prompt, 1100, systemPrompt);
  const parsed = extractJSON(raw);
  if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
    throw new Error("Model returned no practice questions.");
  }

  return {
    questions: parsed.questions.slice(0, 5).map(normalizeQuestion),
  };
}
async function generateResumeJobMatch(resumeText, jobDescription) {
  const systemPrompt =
    "You are an expert resume and job-description matching assistant. Return ONLY valid raw JSON.";

  const prompt = `Compare the candidate's resume against the job description.

RESUME:
${resumeText.slice(0, 5000)}

JOB DESCRIPTION:
${jobDescription.slice(0, 5000)}

Calculate how well the resume matches the job description.

Rules:
- Return a match percentage from 0 to 100.
- Base the score on skills, technologies, experience, projects, education, and other relevant qualifications explicitly present in the resume and job description.
- Do not treat missing information as proof that the candidate lacks the skill.
- Do not invent resume information.
- matchedSkills should contain skills/requirements clearly supported by the resume.
- missingSkills should contain important job requirements that are not clearly supported by the resume.
- Return at most 5 matched skills.
- Return at most 5 missing skills.
- Keep each skill as a short phrase.
- Keep the summary under 30 words.
- The percentage is an AI-based match score, not a hiring probability.

Return ONLY:
{
  "matchPercentage": 0,
  "matchedSkills": [],
  "missingSkills": [],
  "summary": "..."
}`;

  const raw = await callGroq(prompt, 1200, systemPrompt);
  const result = extractJSON(raw);

  const matchPercentage = Number(result.matchPercentage);

  if (
    !Number.isFinite(matchPercentage) ||
    matchPercentage < 0 ||
    matchPercentage > 100
  ) {
    throw new Error("AI returned an invalid match percentage.");
  }

  return {
    matchPercentage: Math.round(matchPercentage),
    matchedSkills: Array.isArray(result.matchedSkills)
      ? result.matchedSkills.slice(0, 10)
      : [],
    missingSkills: Array.isArray(result.missingSkills)
      ? result.missingSkills.slice(0, 10)
      : [],
    summary:
      typeof result.summary === "string"
        ? result.summary
        : "The resume was compared against the job description.",
  };
}

module.exports = { generateQuestions, generateFeedback, generatePracticeQuestions,generateResumeJobMatch, };
