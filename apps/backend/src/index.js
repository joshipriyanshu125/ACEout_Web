import "dotenv/config";
import express from "express";
import cors from "cors";

import { prisma } from "@repo/db";
import { authRouter } from "./routes/auth.routes.js";
import { studentRouter } from "./routes/student.routes.js";
import { adminRouter } from "./routes/admin.routes.js";
import { voiceRouter } from "./voice/voice.routes.js";

const app = express();
app.disable("x-powered-by");
const PORT = process.env.PORT || 5000;

// The admin panel (Vite, :5174) and the app's web build (Expo, :8081) run on
// localhost in development; native builds send no Origin at all. Extra origins
// for a deployed panel go in CORS_ORIGINS, comma separated.
const extraOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: (origin, cb) =>
      cb(null, !origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) || extraOrigins.includes(origin)),
  })
);
app.use(express.json({ limit: "512kb" }));

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get("/health", async (_req, res) => {
  let database = "up";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    database = "down";
  }
  res.json({
    status: database === "up" ? "ok" : "degraded",
    service: "ACEout Virtual Lab API",
    database,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRouter);
app.use("/api/student", studentRouter);
app.use("/api/admin", adminRouter);
// Voice assistant: /api/stt, /api/tts, /api/ask, /api/voice/health
app.use("/api", voiceRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

app.use((err, _req, res, _next) => {
  if (err.status && err.status < 500) {
    return res.status(err.status).json({ error: err.message });
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Malformed JSON body" });
  }
  console.error("Server error:", err);

  if (err.code === "P2002") {
    return res.status(409).json({ error: "That record already exists" });
  }
  res.status(500).json({ error: "Something went wrong on the server" });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 ACEout Virtual Lab API running at http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `❌ Port ${PORT} is already in use — another backend instance is probably running.\n` +
        `   Stop it (e.g. \`fuser -k ${PORT}/tcp\`) or set a different PORT in apps/backend/.env.`,
    );
    process.exit(1);
  }
  throw err;
});

