import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { authRouter } from "./routes/auth.routes.js";
import { experimentsRouter } from "./routes/experiments.routes.js";
import { questsRouter } from "./routes/quests.routes.js";
import { observationsRouter } from "./routes/observations.routes.js";
import { quizzesRouter } from "./routes/quizzes.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
  credentials: true,
}));
app.use(express.json());

// Request logging middleware
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check route
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "LabVR Virtual Science Lab API",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", authRouter);
app.use("/api/experiments", experimentsRouter);
app.use("/api/quests", questsRouter);
app.use("/api/observations", observationsRouter);
app.use("/api/quizzes", quizzesRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Error handling middleware
app.use((err, _req, res, _next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal Server Error", message: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 LabVR Express backend running at http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
});
