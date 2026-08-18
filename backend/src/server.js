const express = require("express");
const cors = require("cors");
const { PORT, CORS_ORIGIN } = require("./config/env");

const uploadRoute = require("./routes/upload");
const generateRoute = require("./routes/generate");
const historyRoute = require("./routes/history");

const app = express();

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/upload", uploadRoute);
app.use("/api/generate", generateRoute);
app.use("/api/history", historyRoute);

// Central error handler — catches anything a route didn't handle itself.
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Something went wrong on the server." });
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
