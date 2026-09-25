import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../lib/auth.js";
import { computeAutoScore, finalScore } from "../lib/scoring.js";

export const teacherRouter = Router();

teacherRouter.use(requireAuth, requireRole("TEACHER", "ADMIN"));

/** Loads a class only if the signed-in teacher owns it. */
async function ownedClass(req, res) {
  const klass = await prisma.class.findUnique({ where: { id: req.params.classId } });
  if (!klass) {
    res.status(404).json({ error: "Class not found" });
    return null;
  }
  if (klass.teacherId !== req.user.id && req.user.role !== "ADMIN") {
    res.status(403).json({ error: "This class belongs to another teacher" });
    return null;
  }
  return klass;
}

function makeJoinCode(name) {
  const letters = (name.match(/[A-Za-z0-9]/g) || []).join("").toUpperCase().slice(0, 4);
  const suffix = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `${letters || "LAB"}${suffix}`;
}

// ---------------------------------------------------------------- classes

teacherRouter.get("/classes", async (req, res, next) => {
  try {
    const classes = await prisma.class.findMany({
      where: { teacherId: req.user.id, archived: false },
      orderBy: { createdAt: "asc" },
      include: {
        _count: { select: { enrollments: true, unlocks: true } },
      },
    });

    // Pending review count: submitted attempts past their due date, not yet graded.
    const enriched = await Promise.all(
      classes.map(async (c) => {
        const pendingReview = await prisma.labAttempt.count({
          where: { classId: c.id, status: "SUBMITTED", gradedAt: null },
        });
        return {
          ...c,
          studentCount: c._count.enrollments,
          unlockedLabCount: c._count.unlocks,
          pendingReview,
        };
      }),
    );

    res.json({ classes: enriched });
  } catch (err) {
    next(err);
  }
});

teacherRouter.post("/classes", async (req, res, next) => {
  try {
    const { name, subject, grade, board } = req.body;
    if (!name || !grade) {
      return res.status(400).json({ error: "Class name and grade are required" });
    }

    let joinCode = makeJoinCode(name);
    while (await prisma.class.findUnique({ where: { joinCode } })) {
      joinCode = makeJoinCode(name);
    }

    const klass = await prisma.class.create({
      data: {
        name: String(name).trim(),
        subject: subject || "physics",
        grade,
        board: board || "CBSE",
        joinCode,
        teacherId: req.user.id,
      },
    });

    res.status(201).json({ class: { ...klass, studentCount: 0, unlockedLabCount: 0, pendingReview: 0 } });
  } catch (err) {
    next(err);
  }
});

teacherRouter.get("/classes/:classId", async (req, res, next) => {
  try {
    const klass = await ownedClass(req, res);
    if (!klass) return;

    const enrollments = await prisma.enrollment.findMany({
      where: { classId: klass.id },
      include: { student: { select: { id: true, name: true, email: true, xp: true, streak: true } } },
      orderBy: { joinedAt: "asc" },
    });

    res.json({
      class: klass,
      students: enrollments.map((e) => ({ ...e.student, joinedAt: e.joinedAt })),
    });
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------- labs & unlocking

/** Every lab in syllabus order, annotated with this class's unlock + progress. */
teacherRouter.get("/classes/:classId/labs", async (req, res, next) => {
  try {
    const klass = await ownedClass(req, res);
    if (!klass) return;

    const [labs, unlocks, studentCount] = await Promise.all([
      prisma.lab.findMany({ orderBy: { orderIndex: "asc" }, include: { _count: { select: { questions: true } } } }),
      prisma.labUnlock.findMany({ where: { classId: klass.id } }),
      prisma.enrollment.count({ where: { classId: klass.id } }),
    ]);

    const unlockByLab = Object.fromEntries(unlocks.map((u) => [u.labId, u]));

    const attempts = await prisma.labAttempt.groupBy({
      by: ["labId", "status"],
      where: { classId: klass.id },
      _count: { _all: true },
    });

    const statsByLab = {};
    for (const row of attempts) {
      const s = (statsByLab[row.labId] ??= { started: 0, submitted: 0 });
      if (row.status === "SUBMITTED") s.submitted += row._count._all;
      else s.started += row._count._all;
    }

    res.json({
      studentCount,
      labs: labs.map((lab) => {
        const unlock = unlockByLab[lab.id] || null;
        const stats = statsByLab[lab.id] || { started: 0, submitted: 0 };
        return {
          id: lab.id,
          title: lab.title,
          subject: lab.subject,
          grade: lab.grade,
          difficulty: lab.difficulty,
          durationMinutes: lab.durationMinutes,
          description: lab.description,
          benchType: lab.benchType,
          tags: lab.tags,
          orderIndex: lab.orderIndex,
          questionCount: lab._count.questions,
          requiredObservations: lab.requiredObservations,
          isUnlocked: Boolean(unlock && !unlock.closedAt),
          unlockedAt: unlock?.unlockedAt ?? null,
          dueAt: unlock?.dueAt ?? null,
          closedAt: unlock?.closedAt ?? null,
          isPastDue: Boolean(unlock?.dueAt && new Date(unlock.dueAt) < new Date()),
          submittedCount: stats.submitted,
          inProgressCount: stats.started,
        };
      }),
    });
  } catch (err) {
    next(err);
  }
});

teacherRouter.post("/classes/:classId/labs/:labId/unlock", async (req, res, next) => {
  try {
    const klass = await ownedClass(req, res);
    if (!klass) return;

    const lab = await prisma.lab.findUnique({ where: { id: req.params.labId } });
    if (!lab) return res.status(404).json({ error: "Lab not found" });

    const dueAt = req.body?.dueAt ? new Date(req.body.dueAt) : null;
    if (dueAt && Number.isNaN(dueAt.getTime())) {
      return res.status(400).json({ error: "Invalid due date" });
    }

    const unlock = await prisma.labUnlock.upsert({
      where: { classId_labId: { classId: klass.id, labId: lab.id } },
      create: { classId: klass.id, labId: lab.id, dueAt, unlockedById: req.user.id },
      // Re-unlocking clears any previous close.
      update: { dueAt, closedAt: null, unlockedAt: new Date(), unlockedById: req.user.id },
    });

    res.json({ unlock });
  } catch (err) {
    next(err);
  }
});

teacherRouter.delete("/classes/:classId/labs/:labId/unlock", async (req, res, next) => {
  try {
    const klass = await ownedClass(req, res);
    if (!klass) return;

    const existing = await prisma.labUnlock.findUnique({
      where: { classId_labId: { classId: klass.id, labId: req.params.labId } },
    });
    if (!existing) return res.status(404).json({ error: "That lab is not unlocked for this class" });

    // Keep the row so submitted work and history survive a re-lock.
    const unlock = await prisma.labUnlock.update({
      where: { id: existing.id },
      data: { closedAt: new Date() },
    });

    res.json({ unlock });
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------------- rankings

/**
 * Ranked students for a class. `?labId=<id>` ranks one lab; omitted ranks the
 * class overall by average score across every unlocked lab.
 */
teacherRouter.get("/classes/:classId/rankings", async (req, res, next) => {
  try {
    const klass = await ownedClass(req, res);
    if (!klass) return;

    const { labId } = req.query;

    const unlocks = await prisma.labUnlock.findMany({
      where: { classId: klass.id, closedAt: null },
      include: { lab: true },
    });
    const scopedUnlocks = labId ? unlocks.filter((u) => u.labId === labId) : unlocks;

    if (labId && scopedUnlocks.length === 0) {
      return res.status(404).json({ error: "That lab is not unlocked for this class" });
    }

    const labIds = scopedUnlocks.map((u) => u.labId);

    const enrollments = await prisma.enrollment.findMany({
      where: { classId: klass.id },
      include: { student: { select: { id: true, name: true, email: true, xp: true } } },
    });

    const attempts = await prisma.labAttempt.findMany({
      where: { classId: klass.id, labId: { in: labIds } },
      include: { _count: { select: { observations: true } } },
    });

    const attemptsByStudent = {};
    for (const a of attempts) {
      (attemptsByStudent[a.studentId] ??= []).push(a);
    }

    const rows = enrollments.map(({ student }) => {
      const mine = attemptsByStudent[student.id] || [];
      const submitted = mine.filter((a) => a.status === "SUBMITTED");

      const scores = submitted.map(finalScore);
      const averageScore = scores.length
        ? Math.round((scores.reduce((s, n) => s + n, 0) / scores.length) * 10) / 10
        : 0;

      const quizCorrect = submitted.reduce((s, a) => s + (a.quizScore || 0), 0);
      const quizTotal = submitted.reduce((s, a) => s + (a.quizTotal || 0), 0);
      const observationCount = mine.reduce((s, a) => s + a._count.observations, 0);
      const timeSpentSeconds = mine.reduce((s, a) => s + a.timeSpentSeconds, 0);

      const lastSubmission = submitted
        .map((a) => a.submittedAt)
        .filter(Boolean)
        .sort((x, y) => new Date(y) - new Date(x))[0] || null;

      return {
        student,
        completedLabs: submitted.length,
        assignedLabs: labIds.length,
        inProgressLabs: mine.filter((a) => a.status === "IN_PROGRESS").length,
        notStartedLabs: labIds.length - mine.length,
        averageScore,
        quizCorrect,
        quizTotal,
        quizAccuracy: quizTotal ? Math.round((quizCorrect / quizTotal) * 1000) / 10 : 0,
        observationCount,
        timeSpentSeconds,
        lastSubmission,
        hasOverride: submitted.some((a) => a.overrideScore !== null),
      };
    });

    // Best average first; ties broken by who finished more labs, then who
    // submitted earlier — so consistent, punctual students rank higher.
    rows.sort((a, b) => {
      if (b.averageScore !== a.averageScore) return b.averageScore - a.averageScore;
      if (b.completedLabs !== a.completedLabs) return b.completedLabs - a.completedLabs;
      if (!a.lastSubmission) return 1;
      if (!b.lastSubmission) return -1;
      return new Date(a.lastSubmission) - new Date(b.lastSubmission);
    });

    let lastScore = null;
    let lastRank = 0;
    rows.forEach((row, i) => {
      // Equal averages share a rank.
      if (row.averageScore === lastScore) {
        row.rank = lastRank;
      } else {
        row.rank = i + 1;
        lastRank = i + 1;
        lastScore = row.averageScore;
      }
    });

    const scored = rows.filter((r) => r.completedLabs > 0);
    res.json({
      scope: labId
        ? { type: "lab", labId, labTitle: scopedUnlocks[0].lab.title, dueAt: scopedUnlocks[0].dueAt }
        : { type: "overall", unlockedLabs: labIds.length },
      summary: {
        studentCount: rows.length,
        submittedCount: scored.length,
        classAverage: scored.length
          ? Math.round((scored.reduce((s, r) => s + r.averageScore, 0) / scored.length) * 10) / 10
          : 0,
        notStartedCount: rows.filter((r) => r.completedLabs === 0 && r.inProgressLabs === 0).length,
      },
      rankings: rows,
    });
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------ individual student

teacherRouter.get("/classes/:classId/students/:studentId", async (req, res, next) => {
  try {
    const klass = await ownedClass(req, res);
    if (!klass) return;

    const enrollment = await prisma.enrollment.findUnique({
      where: { classId_studentId: { classId: klass.id, studentId: req.params.studentId } },
      include: { student: { select: { id: true, name: true, email: true, grade: true, board: true, xp: true, streak: true, bestStreak: true } } },
    });
    if (!enrollment) {
      return res.status(404).json({ error: "That student is not in this class" });
    }

    const unlocks = await prisma.labUnlock.findMany({
      where: { classId: klass.id, closedAt: null },
      include: { lab: { include: { questions: { orderBy: { number: "asc" } } } } },
      orderBy: { unlockedAt: "asc" },
    });

    const attempts = await prisma.labAttempt.findMany({
      where: { classId: klass.id, studentId: enrollment.studentId },
      include: {
        observations: { orderBy: { createdAt: "asc" } },
        quizResponses: true,
        gradedBy: { select: { id: true, name: true } },
      },
    });
    const attemptByLab = Object.fromEntries(attempts.map((a) => [a.labId, a]));

    const labs = unlocks.map((unlock) => {
      const attempt = attemptByLab[unlock.labId] || null;
      const questions = unlock.lab.questions;

      let quizReview = [];
      if (attempt) {
        const byQuestion = Object.fromEntries(
          attempt.quizResponses.map((r) => [r.questionId, r]),
        );
        quizReview = questions.map((q) => {
          const response = byQuestion[q.id] || null;
          return {
            questionId: q.id,
            number: q.number,
            title: q.title,
            options: q.options,
            correctIndex: q.correctIndex,
            explanation: q.explanation,
            selectedIndex: response?.selectedIndex ?? null,
            isCorrect: response?.isCorrect ?? null,
            answered: Boolean(response),
          };
        });
      }

      const breakdown = attempt
        ? computeAutoScore(attempt, attempt.observations.length, unlock.lab.requiredObservations, unlock.dueAt)
            .breakdown
        : null;

      return {
        lab: {
          id: unlock.lab.id,
          title: unlock.lab.title,
          benchType: unlock.lab.benchType,
          difficulty: unlock.lab.difficulty,
          requiredObservations: unlock.lab.requiredObservations,
        },
        unlockedAt: unlock.unlockedAt,
        dueAt: unlock.dueAt,
        attempt: attempt
          ? {
              id: attempt.id,
              status: attempt.status,
              startedAt: attempt.startedAt,
              submittedAt: attempt.submittedAt,
              timeSpentSeconds: attempt.timeSpentSeconds,
              quizScore: attempt.quizScore,
              quizTotal: attempt.quizTotal,
              autoScore: attempt.autoScore,
              overrideScore: attempt.overrideScore,
              finalScore: finalScore(attempt),
              teacherRemark: attempt.teacherRemark,
              gradedAt: attempt.gradedAt,
              gradedBy: attempt.gradedBy,
              observations: attempt.observations,
              breakdown,
            }
          : null,
        quizReview,
      };
    });

    const submitted = labs.filter((l) => l.attempt?.status === "SUBMITTED");
    const average = submitted.length
      ? Math.round(
          (submitted.reduce((s, l) => s + l.attempt.finalScore, 0) / submitted.length) * 10,
        ) / 10
      : 0;

    res.json({
      class: { id: klass.id, name: klass.name },
      student: enrollment.student,
      summary: {
        assignedLabs: labs.length,
        completedLabs: submitted.length,
        inProgressLabs: labs.filter((l) => l.attempt?.status === "IN_PROGRESS").length,
        averageScore: average,
        totalObservations: labs.reduce((s, l) => s + (l.attempt?.observations.length || 0), 0),
        totalTimeSeconds: labs.reduce((s, l) => s + (l.attempt?.timeSpentSeconds || 0), 0),
      },
      labs,
    });
  } catch (err) {
    next(err);
  }
});

/** Teacher override of the auto-score, plus a remark. */
teacherRouter.patch("/attempts/:attemptId/grade", async (req, res, next) => {
  try {
    const attempt = await prisma.labAttempt.findUnique({
      where: { id: req.params.attemptId },
      include: { class: true },
    });
    if (!attempt) return res.status(404).json({ error: "Attempt not found" });
    if (attempt.class.teacherId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "This attempt belongs to another teacher's class" });
    }

    const { overrideScore, teacherRemark } = req.body;

    let score = null;
    if (overrideScore !== null && overrideScore !== undefined && overrideScore !== "") {
      score = Number(overrideScore);
      if (Number.isNaN(score) || score < 0 || score > 100) {
        return res.status(400).json({ error: "Override score must be a number between 0 and 100" });
      }
    }

    const updated = await prisma.labAttempt.update({
      where: { id: attempt.id },
      data: {
        overrideScore: score,
        teacherRemark: teacherRemark ?? attempt.teacherRemark,
        gradedById: req.user.id,
        gradedAt: new Date(),
      },
    });

    res.json({ attempt: { ...updated, finalScore: finalScore(updated) } });
  } catch (err) {
    next(err);
  }
});
