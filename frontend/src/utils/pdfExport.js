import { jsPDF } from "jspdf";

const SUBCATEGORY_LABEL = {
  "skill-based": "Skill",
  "project-based": "Project",
  "system-design": "System design",
  behavioral: "Behavioral",
};

const MARGIN = 14;
const PAGE_WIDTH = 210;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const PAGE_HEIGHT = 297;

function ensureSpace(doc, y, needed) {
  if (y + needed > PAGE_HEIGHT - MARGIN) {
    doc.addPage();
    return MARGIN;
  }
  return y;
}

function entryScore(entry) {
  if (entry.skipped) return null;
  if (entry.type === "mcq") return entry.correct ? 100 : 0;
  return entry.satisfied ? 100 : 40;
}

function scoreEntries(entries) {
  const scores = entries.map(entryScore).filter((score) => score != null);
  if (!scores.length) return 0;
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

function getWeakAreas(sessionLog) {
  const counts = new Map();
  sessionLog.forEach((entry) => {
    const weak = entry.skipped || (entry.type === "mcq" ? !entry.correct : entry.satisfied === false);
    if (!weak || !entry.focus || entry.focus.toLowerCase() === "general") return;
    counts.set(entry.focus, (counts.get(entry.focus) || 0) + 1);
  });
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([focus]) => focus);
}

export function exportInterviewPDF({ session, sessionLog }) {
  try {
    if (!sessionLog || !Array.isArray(sessionLog)) {
      throw new Error("Invalid interview session data");
    }

    const doc = new jsPDF({ unit: "mm", format: "a4" });
    let y = MARGIN;

    doc.setFontSize(16);
    doc.setFont(undefined, "bold");
    doc.setTextColor(0);
    doc.text("Mock Interview Report", MARGIN, y);
    y += 8;

    const answered = sessionLog.filter((entry) => !entry.skipped);
    const skipped = sessionLog.filter((entry) => entry.skipped);
    const overall = scoreEntries(sessionLog);
    const technical = scoreEntries(sessionLog.filter((entry) => entry.sub !== "behavioral"));
    const behavioral = scoreEntries(sessionLog.filter((entry) => entry.sub === "behavioral"));
    const weakAreas = getWeakAreas(sessionLog);

    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.setTextColor(90);
    doc.text(
      `${session?.experienceLevel === "experienced" ? "Experienced" : "Fresher"} · ${answered.length} answered · ${skipped.length} skipped`,
      MARGIN,
      y
    );
    y += 7;

    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    doc.setTextColor(0);
    doc.text("Performance", MARGIN, y);
    y += 5;
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.text(`Overall: ${overall}%`, MARGIN, y);
    doc.text(`Technical: ${technical}%`, MARGIN + 55, y);
    doc.text(`Behavioral: ${behavioral}%`, MARGIN + 110, y);
    y += 7;

    if (session?.extractedData?.skills?.length) {
      const lines = doc.splitTextToSize(`Skills: ${session.extractedData.skills.join(", ")}`, CONTENT_WIDTH);
      y = ensureSpace(doc, y, lines.length * 4.5);
      doc.text(lines, MARGIN, y);
      y += lines.length * 4.5 + 2;
    }

    if (session?.extractedData?.education) {
      const lines = doc.splitTextToSize(`Education: ${session.extractedData.education}`, CONTENT_WIDTH);
      y = ensureSpace(doc, y, lines.length * 4.5);
      doc.text(lines, MARGIN, y);
      y += lines.length * 4.5 + 2;
    }

    if (session?.extractedData?.certifications?.length) {
      const lines = doc.splitTextToSize(`Certifications: ${session.extractedData.certifications.join(", ")}`, CONTENT_WIDTH);
      y = ensureSpace(doc, y, lines.length * 4.5);
      doc.text(lines, MARGIN, y);
      y += lines.length * 4.5 + 2;
    }

    if (weakAreas.length) {
      y += 2;
      doc.setFont(undefined, "bold");
      doc.text("Areas to improve", MARGIN, y);
      y += 4.5;
      doc.setFont(undefined, "normal");
      const lines = doc.splitTextToSize(weakAreas.join(", "), CONTENT_WIDTH);
      y = ensureSpace(doc, y, lines.length * 4.5);
      doc.text(lines, MARGIN, y);
      y += lines.length * 4.5 + 4;
    }

    doc.setTextColor(0);
    doc.setFont(undefined, "bold");
    doc.setFontSize(11);
    y = ensureSpace(doc, y, 8);
    doc.text("Question Review", MARGIN, y);
    y += 7;

    sessionLog.forEach((entry, idx) => {
      y = ensureSpace(doc, y, 20);

      doc.setFontSize(9);
      doc.setFont(undefined, "bold");
      doc.setTextColor(79, 70, 229);
      doc.text(
        `Q${idx + 1} · ${SUBCATEGORY_LABEL[entry.sub] || entry.sub || "Question"} · ${entry.type === "mcq" ? "Multiple choice" : entry.difficulty || "Open"}`,
        MARGIN,
        y
      );
      y += 5;

      if (entry.focus && entry.focus.toLowerCase() !== "general") {
        doc.setFont(undefined, "italic");
        doc.setTextColor(100);
        const focusLines = doc.splitTextToSize(`Based on: ${entry.focus}`, CONTENT_WIDTH);
        y = ensureSpace(doc, y, focusLines.length * 4);
        doc.text(focusLines, MARGIN, y);
        y += focusLines.length * 4 + 1;
      }

      doc.setFontSize(11);
      doc.setFont(undefined, "bold");
      doc.setTextColor(0);
      const questionLines = doc.splitTextToSize(entry.question || "(question unavailable)", CONTENT_WIDTH);
      y = ensureSpace(doc, y, questionLines.length * 5);
      doc.text(questionLines, MARGIN, y);
      y += questionLines.length * 5 + 3;

      if (entry.skipped) {
        doc.setFontSize(9);
        doc.setFont(undefined, "bold");
        doc.setTextColor(180, 120, 0);
        doc.text("You skipped this question.", MARGIN, y);
        y += 5;
      } else if (entry.type === "mcq") {
        doc.setFontSize(9);
        doc.setFont(undefined, "normal");
        (entry.options || []).forEach((opt) => {
          const isSelected = opt === entry.selectedOption;
          const isCorrect = opt === entry.correctOption;
          const prefix = isCorrect ? "✓" : isSelected ? "✗" : "•";
          doc.setTextColor(isCorrect ? 5 : isSelected ? 200 : 90, isCorrect ? 150 : isSelected ? 30 : 90, isCorrect ? 60 : 90);
          const lines = doc.splitTextToSize(`${prefix} ${opt}`, CONTENT_WIDTH - 4);
          y = ensureSpace(doc, y, lines.length * 4.5);
          doc.text(lines, MARGIN + 2, y);
          y += lines.length * 4.5;
        });
        y += 1;
      } else {
        doc.setFontSize(9);
        doc.setFont(undefined, "italic");
        doc.setTextColor(90);
        doc.text(entry.isFollowUp ? "Follow-up answer:" : "Your answer:", MARGIN, y);
        y += 4.5;
        doc.setFont(undefined, "normal");
        doc.setTextColor(30);
        const answerLines = doc.splitTextToSize(entry.answer || "(no answer)", CONTENT_WIDTH);
        y = ensureSpace(doc, y, answerLines.length * 4.5);
        doc.text(answerLines, MARGIN, y);
        y += answerLines.length * 4.5 + 1;
        if (entry.feedback) {
          const feedbackLines = doc.splitTextToSize(`Feedback: ${entry.feedback}`, CONTENT_WIDTH);
          y = ensureSpace(doc, y, feedbackLines.length * 4.5);
          doc.text(feedbackLines, MARGIN, y);
          y += feedbackLines.length * 4.5 + 1;
        }
      }

      if (entry.suggestedAnswer) {
        doc.setFontSize(9);
        doc.setFont(undefined, "bold");
        doc.setTextColor(5, 150, 105);
        y = ensureSpace(doc, y, 5);
        doc.text("Suggested answer:", MARGIN, y);
        y += 4.5;
        doc.setFont(undefined, "normal");
        doc.setTextColor(30);
        const lines = doc.splitTextToSize(entry.suggestedAnswer, CONTENT_WIDTH);
        y = ensureSpace(doc, y, lines.length * 4.5);
        doc.text(lines, MARGIN, y);
        y += lines.length * 4.5;
      }

      y += 5;
      y = ensureSpace(doc, y, 5);
      doc.setDrawColor(225);
      doc.line(MARGIN, y - 2, PAGE_WIDTH - MARGIN, y - 2);
    });

    doc.save("mock-interview-report.pdf");
  } catch (error) {
    console.error("PDF generation failed:", error);
    alert("Unable to generate the PDF. Please check the browser console.");
  }
}
