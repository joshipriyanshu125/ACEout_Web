import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../lib/auth.js";
import { computeAutoScore, finalScore } from "../lib/scoring.js";

export const studentRouter = Router();

studentRouter.use(requireAuth, requireRole("STUDENT", "ADMIN"));

/** Recomputes and stores autoScore for an attempt. */
async function rescore(attemptId) {
  const attempt = await prisma.labAttempt.findUnique({
    where: { id: attemptId },
    include: { lab: true, _count: { select: { observations: true } } },
  });
  if (!attempt) return null;

  const unlock = await prisma.labUnlock.findUnique({
    where: { classId_labId: { classId: attempt.classId, labId: attempt.labId } },
  });

  const { score } = computeAutoScore(
    attempt,
    attempt._count.observations,
    attempt.lab.requiredObservations,
    unlock?.dueAt ?? null,
  );

  return prisma.labAttempt.update({
    where: { id: attempt.id },
    data: { autoScore: score },
  });
}

/** The student's active class. Proto assumption: one class per student. */
async function primaryEnrollment(studentId) {
  return prisma.enrollment.findFirst({
    where: { studentId },
    include: { class: true },
    orderBy: { joinedAt: "asc" },
  });
}

// --------------------------------------------------------------- classes

studentRouter.get("/classes", async (req, res, next) => {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: req.user.id },
      include: { class: { include: { teacher: { select: { id: true, name: true } } } } },
      orderBy: { joinedAt: "asc" },
    });
    res.json({ classes: enrollments.map((e) => ({ ...e.class, joinedAt: e.joinedAt })) });
  } catch (err) {
    next(err);
  }
});

studentRouter.post("/classes/join", async (req, res, next) => {
  try {
    const code = String(req.body?.joinCode || "").trim().toUpperCase();
    if (!code) return res.status(400).json({ error: "A join code is required" });

    const klass = await prisma.class.findUnique({ where: { joinCode: code } });
    if (!klass) return res.status(404).json({ error: "No class found with that code" });

    const existing = await prisma.enrollment.findUnique({
      where: { classId_studentId: { classId: klass.id, studentId: req.user.id } },
    });
    if (existing) return res.status(409).json({ error: "You are already in this class" });

    await prisma.enrollment.create({ data: { classId: klass.id, studentId: req.user.id } });
    res.status(201).json({ class: klass });
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------------------ labs

/** Only labs the teacher has unlocked for this student's class. */
studentRouter.get("/labs", async (req, res, next) => {
  try {
    const enrollment = await primaryEnrollment(req.user.id);
    if (!enrollment) {
      return res.json({ class: null, labs: [], message: "Join a class to see your labs." });
    }

    const [unlocks, attempts, allLabsCount] = await Promise.all([
      prisma.labUnlock.findMany({
        where: { classId: enrollment.classId, closedAt: null },
        include: { lab: { include: { _count: { select: { questions: true } } } } },
        orderBy: { unlockedAt: "asc" },
      }),
      prisma.labAttempt.findMany({
        where: { studentId: req.user.id, classId: enrollment.classId },
        include: { _count: { select: { observations: true } } },
      }),
      prisma.lab.count(),
    ]);

    const attemptByLab = Object.fromEntries(attempts.map((a) => [a.labId, a]));

    const labs = unlocks.map((u) => {
      const attempt = attemptByLab[u.labId] || null;
      return {
        id: u.lab.id,
        title: u.lab.title,
        subject: u.lab.subject,
        grade: u.lab.grade,
        durationMinutes: u.lab.durationMinutes,
        difficulty: u.lab.difficulty,
        description: u.lab.description,
        benchType: u.lab.benchType,
        tags: u.lab.tags,
        questionCount: u.lab._count.questions,
        requiredObservations: u.lab.requiredObservations,
        unlockedAt: u.unlockedAt,
        dueAt: u.dueAt,
        isPastDue: Boolean(u.dueAt && new Date(u.dueAt) < new Date()),
        status: attempt?.status ?? "NOT_STARTED",
        observationCount: attempt?._count.observations ?? 0,
        quizScore: attempt?.quizScore ?? null,
        quizTotal: attempt?.quizTotal ?? null,
        score: attempt && attempt.status === "SUBMITTED" ? finalScore(attempt) : null,
        teacherRemark: attempt?.teacherRemark ?? null,
      };
    });

    res.json({
      class: { id: enrollment.class.id, name: enrollment.class.name, joinCode: enrollment.class.joinCode },
      labs,
      lockedCount: Math.max(0, allLabsCount - labs.length),
    });
  } catch (err) {
    next(err);
  }
});

/** Quiz questions for a lab — only if it's unlocked. Correct answers withheld. */
studentRouter.get("/labs/:labId/quiz", async (req, res, next) => {
  try {
    const enrollment = await primaryEnrollment(req.user.id);
    if (!enrollment) return res.status(403).json({ error: "Join a class first" });

    const unlock = await prisma.labUnlock.findUnique({
      where: { classId_labId: { classId: enrollment.classId, labId: req.params.labId } },
    });
    if (!unlock || unlock.closedAt) {
      return res.status(403).json({ error: "This lab is locked" });
    }

    const questions = await prisma.quizQuestion.findMany({
      where: { labId: req.params.labId },
      orderBy: { number: "asc" },
    });

    res.json({
      questions: questions.map((q) => ({
        id: q.id,
        number: q.number,
        total: questions.length,
        title: q.title,
        subtitle: q.subtitle,
        instrumentType: q.instrumentType,
        displayValue: q.displayValue,
        leastCount: q.leastCount,
        options: q.options,
        hintTitle: q.hintTitle,
        hintDescription: q.hintDescription,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// --------------------------------------------------------------- attempts

/** Starts (or resumes) an attempt. Enforces the unlock. */
studentRouter.post("/labs/:labId/start", async (req, res, next) => {
  try {
    const enrollment = await primaryEnrollment(req.user.id);
    if (!enrollment) return res.status(403).json({ error: "Join a class first" });

    const unlock = await prisma.labUnlock.findUnique({
      where: { classId_labId: { classId: enrollment.classId, labId: req.params.labId } },
    });
    if (!unlock || unlock.closedAt) {
      return res.status(403).json({ error: "Your teacher has not unlocked this lab yet" });
    }

    const attempt = await prisma.labAttempt.upsert({
      where: {
        studentId_labId_classId: {
          studentId: req.user.id,
          labId: req.params.labId,
          classId: enrollment.classId,
        },
      },
      create: {
        studentId: req.user.id,
        labId: req.params.labId,
        classId: enrollment.classId,
      },
      update: {},
      include: { observations: { orderBy: { createdAt: "asc" } } },
    });

    res.json({ attempt, dueAt: unlock.dueAt });
  } catch (err) {
    next(err);
  }
});

/** Logs one observation from the virtual bench. */
studentRouter.post("/labs/:labId/observations", async (req, res, next) => {
  try {
    const enrollment = await primaryEnrollment(req.user.id);
    if (!enrollment) return res.status(403).json({ error: "Join a class first" });

    const { readings, notes, experimentTitle } = req.body;
    if (!readings || typeof readings !== "object") {
      return res.status(400).json({ error: "Readings are required" });
    }

    const attempt = await prisma.labAttempt.findUnique({
      where: {
        studentId_labId_classId: {
          studentId: req.user.id,
          labId: req.params.labId,
          classId: enrollment.classId,
        },
      },
    });
    if (!attempt) return res.status(404).json({ error: "Start the lab before logging readings" });
    if (attempt.status === "SUBMITTED") {
      return res.status(409).json({ error: "This lab is already submitted" });
    }

    const observation = await prisma.observation.create({
      data: {
        attemptId: attempt.id,
        experimentTitle: experimentTitle || "Observation",
        readings,
        notes: notes || "",
      },
    });

    await rescore(attempt.id);
    res.status(201).json({ observation });
  } catch (err) {
    next(err);
  }
});

/** Grades the quiz server-side — the client never sees the answer key. */
studentRouter.post("/labs/:labId/quiz", async (req, res, next) => {
  try {
    const enrollment = await primaryEnrollment(req.user.id);
    if (!enrollment) return res.status(403).json({ error: "Join a class first" });

    const { answers } = req.body; // [{ questionId, selectedIndex }]
    if (!Array.isArray(answers)) {
      return res.status(400).json({ error: "Answers must be an array" });
    }

    const attempt = await prisma.labAttempt.findUnique({
      where: {
        studentId_labId_classId: {
          studentId: req.user.id,
          labId: req.params.labId,
          classId: enrollment.classId,
        },
      },
    });
    if (!attempt) return res.status(404).json({ error: "Start the lab first" });
    if (attempt.status === "SUBMITTED") {
      return res.status(409).json({ error: "This lab is already submitted" });
    }

    const questions = await prisma.quizQuestion.findMany({ where: { labId: req.params.labId } });
    const byId = Object.fromEntries(questions.map((q) => [q.id, q]));

    let correct = 0;
    const results = [];
    for (const a of answers) {
      const q = byId[a.questionId];
      if (!q) continue;
      const isCorrect = q.correctIndex === Number(a.selectedIndex);
      if (isCorrect) correct++;

      await prisma.quizResponse.upsert({
        where: { attemptId_questionId: { attemptId: attempt.id, questionId: q.id } },
        create: {
          attemptId: attempt.id,
          questionId: q.id,
          selectedIndex: Number(a.selectedIndex),
          isCorrect,
        },
        update: { selectedIndex: Number(a.selectedIndex), isCorrect },
      });

      results.push({
        questionId: q.id,
        isCorrect,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
      });
    }

    await prisma.labAttempt.update({
      where: { id: attempt.id },
      data: { quizScore: correct, quizTotal: questions.length },
    });
    const updated = await rescore(attempt.id);

    res.json({ score: correct, total: questions.length, results, autoScore: updated?.autoScore });
  } catch (err) {
    next(err);
  }
});

/** Final submission — locks the attempt and freezes the score for ranking. */
studentRouter.post("/labs/:labId/submit", async (req, res, next) => {
  try {
    const enrollment = await primaryEnrollment(req.user.id);
    if (!enrollment) return res.status(403).json({ error: "Join a class first" });

    const attempt = await prisma.labAttempt.findUnique({
      where: {
        studentId_labId_classId: {
          studentId: req.user.id,
          labId: req.params.labId,
          classId: enrollment.classId,
        },
      },
      include: { _count: { select: { observations: true } } },
    });
    if (!attempt) return res.status(404).json({ error: "Start the lab first" });
    if (attempt.status === "SUBMITTED") {
      return res.status(409).json({ error: "Already submitted" });
    }
    if (attempt._count.observations === 0) {
      return res.status(400).json({ error: "Log at least one reading before submitting" });
    }

    await prisma.labAttempt.update({
      where: { id: attempt.id },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
        timeSpentSeconds:
          attempt.timeSpentSeconds || Math.round((Date.now() - attempt.startedAt.getTime()) / 1000),
      },
    });

    const scored = await rescore(attempt.id);
    res.json({ attempt: scored, score: finalScore(scored) });
  } catch (err) {
    next(err);
  }
});

/** The student's own results — their marks and the teacher's remarks. */
studentRouter.get("/results", async (req, res, next) => {
  try {
    const enrollment = await primaryEnrollment(req.user.id);
    if (!enrollment) return res.json({ results: [], averageScore: 0 });

    const attempts = await prisma.labAttempt.findMany({
      where: { studentId: req.user.id, classId: enrollment.classId, status: "SUBMITTED" },
      include: { lab: { select: { title: true, benchType: true } } },
      orderBy: { submittedAt: "desc" },
    });

    const results = attempts.map((a) => ({
      labId: a.labId,
      labTitle: a.lab.title,
      submittedAt: a.submittedAt,
      quizScore: a.quizScore,
      quizTotal: a.quizTotal,
      score: finalScore(a),
      wasOverridden: a.overrideScore !== null,
      teacherRemark: a.teacherRemark,
    }));

    res.json({
      results,
      averageScore: results.length
        ? Math.round((results.reduce((s, r) => s + r.score, 0) / results.length) * 10) / 10
        : 0,
    });
  } catch (err) {
    next(err);
  }
});
