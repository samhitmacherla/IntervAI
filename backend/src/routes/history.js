// GET /api/history      -> performance history, most recent first
// GET /api/history/:id  -> full interview detail with performance analytics

const express = require("express");
const prisma = require("../config/db");

const router = express.Router();

function scoreAnswer(answer, question) {
  if (!answer) return null;
  if (question.type === "mcq") return answer.satisfied ? 100 : 0;
  return answer.satisfied ? 100 : 40;
}

function calculateSession(session) {
  const entries = [];
  for (const q of session.questions || []) {
    const answer = (q.answers || []).find((a) => a.depth === 0);
    const score = scoreAnswer(answer, q);
    entries.push({ q, answer, score });
  }

  const scored = entries.map((e) => e.score).filter((v) => v !== null);
  const overallScore = scored.length
    ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length)
    : 0;

  const categoryScores = {};
  for (const sub of ["skill-based", "project-based", "behavioral"]) {
    const values = entries.filter((e) => e.q.sub === sub).map((e) => e.score).filter((v) => v !== null);
    categoryScores[sub] = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
  }

  const answeredCount = entries.filter((e) => e.answer).length;
  const skippedCount = entries.length - answeredCount;

  return { overallScore, categoryScores, answeredCount, skippedCount };
}

router.get("/", async (req, res) => {
  try {
    const sessions = await prisma.interviewSession.findMany({
      where: { mode: "mock" },
      orderBy: { createdAt: "desc" },
      include: {
        resume: { select: { fileName: true } },
        questions: { include: { answers: { orderBy: { depth: "asc" } } } },
      },
    });

    res.json(
      sessions.map((s) => {
        const analytics = calculateSession(s);
        return {
          id: s.id,
          fileName: s.resume?.fileName || "Pasted resume",
          experienceLevel: s.experienceLevel,
          difficulty: s.difficulty,
          skills: s.skills,
          projects: s.projects,
          createdAt: s.createdAt,
          questionCount: s.questions.length,
          ...analytics,
        };
      })
    );
  } catch (err) {
    console.error("Failed to list history:", err);
    res.status(500).json({ error: "Couldn't load history." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const session = await prisma.interviewSession.findUnique({
      where: { id: req.params.id },
      include: {
        resume: { select: { fileName: true } },
        questions: {
          orderBy: { qIndex: "asc" },
          include: { answers: { orderBy: { depth: "asc" } } },
        },
      },
    });

    if (!session) return res.status(404).json({ error: "Session not found" });

    res.json({ ...session, analytics: calculateSession(session) });
  } catch (err) {
    console.error("Failed to load session:", err);
    res.status(500).json({ error: "Couldn't load that session." });
  }
});

module.exports = router;
