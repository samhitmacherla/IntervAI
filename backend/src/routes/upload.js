// POST /api/upload
// Accepts either a multipart file (pdf/txt) or raw pasted text,
// extracts plain text, saves a Resume row, and returns its id + text
// so the frontend can immediately call /api/generate with it.

const express = require("express");
const multer = require("multer");
const prisma = require("../config/db");
const { extractText } = require("../services/resumeParser");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

router.post("/", upload.single("file"), async (req, res) => {
  try {
    let text;
    let fileName = null;

    if (req.file) {
      text = await extractText(req.file.buffer, req.file.mimetype);
      fileName = req.file.originalname;
    } else if (req.body.text && req.body.text.trim()) {
      text = req.body.text.trim();
    } else {
      return res.status(400).json({ error: "Provide a file upload or a 'text' field with pasted resume text." });
    }

    const resume = await prisma.resume.create({
      data: { fileName, rawText: text },
    });

    res.json({ resumeId: resume.id, text });
  } catch (err) {
    console.error("Upload failed:", err);
    res.status(400).json({ error: err.message || "Failed to process resume upload." });
  }
});

module.exports = router;
