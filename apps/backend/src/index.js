import "dotenv/config";
import express from "express";
import cors from "cors";

import { prisma } from "./lib/prisma.js";
import { authRouter } from "./routes/auth.routes.js";
<<<<<<< HEAD
import { experimentsRouter } from "./routes/experiments.routes.js";
import { questsRouter } from "./routes/quests.routes.js";
import { observationsRouter } from "./routes/observations.routes.js";
import { quizzesRouter } from "./routes/quizzes.routes.js";
import { adminRouter } from "./routes/admin.routes.js";

dotenv.config();
=======
import { teacherRouter } from "./routes/teacher.routes.js";
import { studentRouter } from "./routes/student.routes.js";
>>>>>>> ec381b64534eceb6f2d6001da93c88821721429b

const app = express();
const PORT = process.env.PORT || 5000;

<<<<<<< HEAD
// Middlewares
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:5174"],
  credentials: true,
}));
=======
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:3000",
    ],
    credentials: true,
  }),
);
>>>>>>> ec381b64534eceb6f2d6001da93c88821721429b
app.use(express.json());

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
<<<<<<< HEAD
app.use("/api/experiments", experimentsRouter);
app.use("/api/quests", questsRouter);
app.use("/api/observations", observationsRouter);
app.use("/api/quizzes", quizzesRouter);
app.use("/api/admin", adminRouter);
=======
app.use("/api/teacher", teacherRouter);
app.use("/api/student", studentRouter);
>>>>>>> ec381b64534eceb6f2d6001da93c88821721429b

app.use((_req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

app.use((err, _req, res, _next) => {
  console.error("Server error:", err);
  // Prisma unique-constraint violation
  if (err.code === "P2002") {
    return res.status(409).json({ error: "That record already exists" });
  }
  res.status(500).json({ error: "Internal Server Error", message: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 ACEout Virtual Lab API running at http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
});
