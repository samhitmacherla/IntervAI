// Turns an uploaded file buffer into plain resume text.
// Supports PDF (via pdf-parse) and plain .txt uploads.

const pdfParse = require("pdf-parse");

async function extractText(buffer, mimeType) {
  if (mimeType === "application/pdf") {
    const data = await pdfParse(buffer);
    const text = (data.text || "").trim();
    if (!text) {
      throw new Error("Couldn't read text from that PDF — it may be a scanned image. Try a text-based PDF or paste the resume text instead.");
    }
    return text;
  }

  if (mimeType === "text/plain") {
    return buffer.toString("utf-8").trim();
  }

  throw new Error("Unsupported file type. Upload a .pdf or .txt file.");
}

module.exports = { extractText };
