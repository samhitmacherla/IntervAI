// POST /api/generate            -> build the 20-question interview session
// POST /api/generate/feedback   -> score one OPEN answer and decide feedback/follow-up
// POST /api/generate/mcq-answer -> check one MCQ answer deterministically
// POST /api/generate/practice   -> build 5 targeted practice questions from weak areas

const express = require("express");
const prisma = require("../config/db");
const {
  generateQuestions,
  generateFeedback,
  generatePracticeQuestions,
   generateResumeJobMatch,
} = require("../services/llmService");

const router = express.Router();

function sendLLMError(res, err, fallback) {
  console.error(err);
  if (err.status === 429 || err.code === "RATE_LIMIT_EXCEEDED") {
    return res.status(429).json({ error: err.message });
  }
  return res.status(500).json({ error: fallback });
}

// Build a fresh interview session from a previously uploaded resume.
router.post("/", async (req, res) => {
  try {
    const { resumeId, difficulty = "medium", mode = "mock" } = req.body;

    if (!resumeId) {
      return res.status(400).json({
        error: "resumeId is required",
      });
    }

    const allowedDifficulties = ["easy", "medium", "hard"];

    if (!allowedDifficulties.includes(difficulty)) {
      return res.status(400).json({
        error: "Difficulty must be easy, medium, or hard.",
      });
    }

    if (!["mock", "bank"].includes(mode)) {
      return res.status(400).json({ error: "Mode must be mock or bank." });
    }

    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
    });

    if (!resume) {
      return res.status(404).json({
        error: "Resume not found",
      });
    }

    const {
      experienceLevel,
      extractedData,
      questions,
    } = await generateQuestions(resume.rawText, difficulty);

    const session = await prisma.interviewSession.create({
      data: {
        resumeId: resume.id,
        experienceLevel,
        education: extractedData.education || null,
        certifications: extractedData.certifications || [],
        skills: extractedData.skills || [],
        projects: extractedData.projects || [],
        experienceSummary: extractedData.experience || null,
        difficulty,
        mode,
        questions: {
          create: questions.map((q, i) => ({
            qIndex: i + 1,
            sub: q.sub,
            difficulty: q.diff,
            type: q.type,
            text: q.q,
            focus: q.b || null,
            sourceType: q.sourceType || null,
            options: q.options || [],
            correctOption: q.correctOption || null,
            suggestedAnswer: q.suggestedAnswer || null,
          })),
        },
      },
      include: { questions: { orderBy: { qIndex: "asc" } } },
    });

    res.json({
      sessionId: session.id,
      resumeId: resume.id,
      experienceLevel: session.experienceLevel,
      difficulty,
      mode,
      extractedData: {
        skills: session.skills,
        projects: session.projects,
        experience: session.experienceSummary,
        education: session.education,
        certifications: session.certifications,
      },
      questions: session.questions,
    });
  } catch (err) {
    return sendLLMError(res, err, "Couldn't generate questions from that resume — try again.");
  }
});

// Generate a small targeted practice set. These questions are intentionally not
// persisted as an interview session, so practice does not pollute History.
router.post("/practice", async (req, res) => {
  try {
    const { resumeId, weakAreas } = req.body;
    if (!resumeId) return res.status(400).json({ error: "resumeId is required" });

    const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
    if (!resume) return res.status(404).json({ error: "Resume not found" });

    const result = await generatePracticeQuestions(
      resume.rawText,
      Array.isArray(weakAreas) ? weakAreas : []
    );

    res.json({
      practice: true,
      resumeId: resume.id,
      experienceLevel: "practice",
      extractedData: null,
      questions: result.questions,
    });
  } catch (err) {
    return sendLLMError(res, err, "Couldn't create the targeted practice set — try again.");
  }
});
// Compare a resume against a job description and return an AI match score.
router.post("/match", async (req, res) => {
  try {
    const { resumeId, jobDescription } = req.body;

    if (!resumeId) {
      return res.status(400).json({
        error: "resumeId is required",
      });
    }

    if (!jobDescription || !jobDescription.trim()) {
      return res.status(400).json({
        error: "Job description is required",
      });
    }

    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
    });

    if (!resume) {
      return res.status(404).json({
        error: "Resume not found",
      });
    }

    const result = await generateResumeJobMatch(
      resume.rawText,
      jobDescription.trim()
    );

    res.json({
      resumeId: resume.id,
      ...result,
    });
  } catch (err) {
    return sendLLMError(
      res,
      err,
      "Couldn't calculate the resume-job match. Please try again."
    );
  }
});


function checkIfGibberish(text) {
  if (!text || text.trim().length === 0) return true;
  const cleaned = text.toLowerCase().trim();
  if (cleaned.length < 3) return true;
  if (/^\d+$/.test(cleaned)) return true;

  const charCounts = {};
  for (const char of cleaned) charCounts[char] = (charCounts[char] || 0) + 1;
  const maxCount = Math.max(...Object.values(charCounts));
  if (maxCount / cleaned.length > 0.7) return true;

  const vowels = cleaned.match(/[aeiou]/g);
  if (!vowels || vowels.length < cleaned.length * 0.15) return true;

  const specialChars = cleaned.match(/[^a-z0-9\s]/g) || [];
  if (specialChars.length > cleaned.length * 0.5) return true;

  return false;
}

router.post("/feedback", async (req, res) => {
  try {
    const {
      questionId,
      exchangeDepth,
      exchangeText,
      answerText,
      topicHistory,
      sub,
      difficulty,
    } = req.body;

    if (!questionId || exchangeText === undefined || !answerText) {
      return res.status(400).json({
        error: "questionId, exchangeText, and answerText are required",
      });
    }

    const question = await prisma.question.findUnique({ where: { id: questionId } });
    const effectiveSub = question ? question.sub : sub;
    const effectiveDifficulty = question ? question.difficulty : difficulty;

    if (!effectiveSub || !effectiveDifficulty) {
      return res.status(400).json({ error: "Missing sub/difficulty for this question." });
    }

    let result;
    if (checkIfGibberish(answerText)) {
      result = {
        feedback: "That answer doesn't address the question — moving on to the next one.",
        satisfied: false,
        nextDifficulty: effectiveDifficulty,
        followUpQuestion: null,
      };
    } else {
      result = await generateFeedback({
        sub: effectiveSub,
        difficulty: effectiveDifficulty,
        exchangeDepth: exchangeDepth || 0,
        exchangeText,
        answerText,
        topicHistory: topicHistory || [],
      });
    }

    if (question) {
      await prisma.answer.create({
        data: {
          questionId,
          depth: exchangeDepth || 0,
          answerText,
          feedback: result.feedback,
          satisfied: result.satisfied,
        },
      });
    }

    res.json(result);
  } catch (err) {
    return sendLLMError(res, err, "Feedback failed — try submitting again.");
  }
});

router.post("/mcq-answer", async (req, res) => {
  try {
    const { questionId, selectedOption } = req.body;
    if (!questionId || !selectedOption) {
      return res.status(400).json({ error: "questionId and selectedOption are required" });
    }

    const question = await prisma.question.findUnique({ where: { id: questionId } });
    if (!question) return res.status(404).json({ error: "Question not found" });
    if (question.type !== "mcq") {
      return res.status(400).json({ error: "That question isn't multiple choice" });
    }

    const correct = selectedOption === question.correctOption;
    const feedback = correct
      ? `Correct. ${question.suggestedAnswer || ""}`.trim()
      : `Not quite — the correct answer is "${question.correctOption}". ${question.suggestedAnswer || ""}`.trim();

    await prisma.answer.create({
      data: {
        questionId,
        depth: 0,
        answerText: selectedOption,
        feedback,
        satisfied: correct,
      },
    });

    res.json({
      correct,
      correctOption: question.correctOption,
      suggestedAnswer: question.suggestedAnswer,
      feedback,
    });
  } catch (err) {
    console.error("MCQ answer check failed:", err);
    res.status(500).json({ error: "Couldn't check that answer — try again." });
  }
});

module.exports = router;
