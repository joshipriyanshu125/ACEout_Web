import { Router } from "express";
import { prisma } from "@repo/db";
import { requireAuth, requireRole } from "../lib/auth.js";
import { computeAutoScore, finalScore } from "@repo/db/scoring";
import { handle, HttpError, round1 } from "../lib/http.js";
import { gradeAnswer, livePoints, publicQuestion } from "../lib/quiz.js";
import { studentView, freshSession } from "../lib/live.js";

export const studentRouter = Router();

studentRouter.use(requireAuth, requireRole("STUDENT"));

// Every authenticated call from the phone counts as activity.
studentRouter.use((req, _res, next) => {
  prisma.user
    .update({ where: { id: req.user.id }, data: { lastActiveAt: new Date() } })
    .catch(() => {});
  next();
});

/** The student's section. Students belong to exactly one. */
async function myEnrollment(studentId) {
  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId },
    include: { class: true },
    orderBy: { joinedAt: "asc" },
  });
  if (!enrollment) throw new HttpError(403, "Join a class first");
  return enrollment;
}

async function openAssignment(classId, labId) {
  const assignment = await prisma.assignment.findUnique({
    where: { classId_labId: { classId, labId } },
  });
  if (!assignment || assignment.closedAt) {
    throw new HttpError(403, "This lab has not been assigned to your class");
  }
  return assignment;
}

function afterLabQuiz(labId) {
  return prisma.quiz.findFirst({
    where: { labId, mode: "AFTER_LAB", status: { not: "DRAFT" } },
    include: { questions: { orderBy: { number: "asc" } } },
    orderBy: { createdAt: "asc" },
  });
}

function labStatus(attempt) {
  if (!attempt) return "NOT_STARTED";
  return attempt.status === "SUBMITTED" ? "COMPLETED" : "IN_PROGRESS";
}

// ---------------------------------------------------------------- labs

/** Labs assigned to the student's section, with their post-lab quiz. */
studentRouter.get(
  "/labs",
  handle(async (req, res) => {
    const { class: klass } = await myEnrollment(req.user.id);

    const [assignments, attempts] = await Promise.all([
      prisma.assignment.findMany({
        where: { classId: klass.id, closedAt: null },
        include: { lab: true },
        orderBy: [{ dueAt: "asc" }, { assignedAt: "asc" }],
      }),
      prisma.labAttempt.findMany({ where: { studentId: req.user.id, classId: klass.id } }),
    ]);
    const attemptByLab = Object.fromEntries(attempts.map((a) => [a.labId, a]));

    const labs = await Promise.all(
      assignments.map(async (a) => {
        const attempt = attemptByLab[a.labId] || null;
        const quiz = a.attachQuiz ? await afterLabQuiz(a.labId) : null;
        return {
          id: a.lab.id,
          assignmentId: a.id,
          title: a.lab.title,
          subject: a.lab.subject,
          grade: a.lab.grade,
          chapterNo: a.lab.chapterNo,
          unit: a.lab.unit,
          durationMinutes: a.lab.durationMinutes,
          abbr: a.lab.abbr,
          requiredObservations: a.lab.requiredObservations,
          assignedAt: a.assignedAt,
          dueAt: a.dueAt,
          isPastDue: Boolean(a.dueAt && a.dueAt < new Date()),
          hintLevel: a.hintLevel,
          allowOffline: a.allowOffline,
          status: labStatus(attempt),
          score: attempt?.status === "SUBMITTED" ? finalScore(attempt) : null,
          quizScore: attempt?.quizScore ?? null,
          quizTotal: attempt?.quizTotal ?? null,
          teacherRemark: attempt?.teacherRemark ?? null,
          submittedAt: attempt?.submittedAt ?? null,
          quiz: quiz
            ? { id: quiz.id, title: quiz.title, questions: quiz.questions.map(publicQuestion) }
            : null,
        };
      }),
    );

    res.json({ labs });
  }),
);

/**
 * Records a finished bench in one call: the readings, the post-lab quiz
 * answers, and the submission. Safe to retry — the phone queues this when it
 * is offline and replays it later; a second delivery gets 409 plus the stored
 * result.
 */
studentRouter.post(
  "/labs/:labId/complete",
  handle(async (req, res) => {
    const { class: klass } = await myEnrollment(req.user.id);
    const assignment = await openAssignment(klass.id, req.params.labId);
    const lab = await prisma.lab.findUnique({ where: { id: req.params.labId } });

    const body = req.body ?? {};
    const readings = Array.isArray(body.readings) ? body.readings.slice(0, 200) : [];
    const answers = Array.isArray(body.answers) ? body.answers : [];
    const faultSteps = Array.isArray(body.faultSteps)
      ? body.faultSteps.map((s) => String(s).slice(0, 80)).slice(0, 100)
      : [];
    const precision =
      body.precision === null || body.precision === undefined || !Number.isFinite(Number(body.precision))
        ? null
        : Math.max(0, Math.min(100, Number(body.precision)));
    const completedAt = body.completedAt ? new Date(body.completedAt) : new Date();
    const submittedAt =
      Number.isNaN(completedAt.getTime()) || completedAt > new Date() ? new Date() : completedAt;
    const timeSpentSeconds = Math.max(0, Math.min(6 * 3600, Math.round(Number(body.timeSpentSeconds) || 0)));

    const key = { studentId: req.user.id, labId: lab.id, classId: klass.id };
    const existing = await prisma.labAttempt.findUnique({ where: { studentId_labId_classId: key } });
    if (existing?.status === "SUBMITTED") {
      return res.status(409).json({
        error: "This lab is already submitted",
        result: {
          score: finalScore(existing),
          quizScore: existing.quizScore,
          quizTotal: existing.quizTotal,
          xpEarned: existing.xpEarned,
          review: [],
        },
      });
    }

    const attempt =
      existing ??
      (await prisma.labAttempt.create({
        data: { ...key, startedAt: new Date(submittedAt.getTime() - timeSpentSeconds * 1000) },
      }));

    // Readings: one Observation per row of the student's data table.
    await prisma.observation.deleteMany({ where: { attemptId: attempt.id } });
    if (readings.length) {
      await prisma.observation.createMany({
        data: readings.map((r, i) => ({
          attemptId: attempt.id,
          experimentTitle: `${lab.title} · reading ${i + 1}`,
          readings: r && typeof r === "object" ? r : { value: r },
        })),
      });
    }

    // Post-lab quiz, graded here — the phone never has the key.
    let quizScore = null;
    let quizTotal = null;
    const review = [];
    const quiz = assignment.attachQuiz ? await afterLabQuiz(lab.id) : null;
    if (quiz && quiz.questions.length) {
      const byId = Object.fromEntries(answers.map((a) => [a.questionId, a]));
      quizScore = 0;
      quizTotal = quiz.questions.length;
      await prisma.quizAnswer.deleteMany({ where: { attemptId: attempt.id } });
      for (const q of quiz.questions) {
        const given = byId[q.id];
        const isCorrect = given ? gradeAnswer(q, given) : false;
        if (isCorrect) quizScore++;
        if (given) {
          await prisma.quizAnswer.create({
            data: {
              quizId: quiz.id,
              questionId: q.id,
              studentId: req.user.id,
              attemptId: attempt.id,
              selectedIndex: Number.isInteger(given.selectedIndex) ? given.selectedIndex : null,
              value: given.value != null ? String(given.value).slice(0, 40) : null,
              isCorrect,
              points: isCorrect ? q.points : 0,
            },
          });
        }
        review.push({
          questionId: q.id,
          isCorrect,
          correctIndex: q.type === "NUMERIC" ? null : q.correctIndex,
          answer: q.type === "NUMERIC" ? q.options[0] : null,
          explanation: q.explanation,
        });
      }
    }

    const scoring = computeAutoScore(
      { quizScore, quizTotal, status: "SUBMITTED", submittedAt },
      readings.length,
      lab.requiredObservations,
      assignment.dueAt,
    );
    const xpEarned = 50 + Math.round(scoring.score);

    const updated = await prisma.labAttempt.update({
      where: { id: attempt.id },
      data: {
        status: "SUBMITTED",
        submittedAt,
        timeSpentSeconds,
        precision,
        faults: faultSteps.length,
        faultSteps,
        quizScore,
        quizTotal,
        autoScore: scoring.score,
        xpEarned,
      },
    });
    await prisma.user.update({ where: { id: req.user.id }, data: { xp: { increment: xpEarned } } });

    res.status(201).json({
      result: {
        score: finalScore(updated),
        breakdown: scoring.breakdown,
        quizScore,
        quizTotal,
        xpEarned,
        review,
      },
    });
  }),
);

// ----------------------------------------------------------- dashboard

/**
 * Home screen for School/College mode: what has been covered, what hasn't,
 * and the marks earned so far.
 */
studentRouter.get(
  "/dashboard",
  handle(async (req, res) => {
    const { class: klass } = await myEnrollment(req.user.id);

    const [me, assignments, attempts, liveAnswers] = await Promise.all([
      prisma.user.findUnique({ where: { id: req.user.id }, select: { name: true, xp: true, rollNo: true } }),
      prisma.assignment.findMany({
        where: { classId: klass.id, closedAt: null },
        include: { lab: true },
        orderBy: [{ dueAt: "asc" }, { assignedAt: "asc" }],
      }),
      prisma.labAttempt.findMany({ where: { studentId: req.user.id, classId: klass.id } }),
      prisma.quizAnswer.findMany({
        where: { studentId: req.user.id, sessionId: { not: null } },
        include: {
          quiz: { select: { title: true } },
          session: { select: { status: true, endedAt: true } },
        },
      }),
    ]);
    const attemptByLab = Object.fromEntries(attempts.map((a) => [a.labId, a]));

    const labs = assignments.map((a) => {
      const attempt = attemptByLab[a.labId] || null;
      return {
        id: a.lab.id,
        title: a.lab.title,
        subject: a.lab.subject,
        abbr: a.lab.abbr,
        dueAt: a.dueAt,
        isPastDue: Boolean(a.dueAt && a.dueAt < new Date()),
        status: labStatus(attempt),
        score: attempt?.status === "SUBMITTED" ? finalScore(attempt) : null,
        quizScore: attempt?.quizScore ?? null,
        quizTotal: attempt?.quizTotal ?? null,
        teacherRemark: attempt?.teacherRemark ?? null,
      };
    });

    const covered = labs.filter((l) => l.status === "COMPLETED");
    const marksEarned = round1(covered.reduce((s, l) => s + l.score, 0));

    // Live quizzes the student took, once the session has ended.
    const byQuiz = {};
    for (const a of liveAnswers) {
      if (a.session?.status !== "DONE") continue;
      const row = (byQuiz[a.quizId] ??= {
        id: a.quizId,
        title: a.quiz.title,
        correct: 0,
        total: 0,
        points: 0,
        at: a.session.endedAt,
      });
      row.total++;
      if (a.isCorrect) row.correct++;
      row.points += a.points;
    }

    res.json({
      student: me,
      class: {
        id: klass.id,
        grade: klass.grade,
        section: klass.section,
        name: `Class ${klass.grade} · Section ${klass.section}`,
      },
      summary: {
        assigned: labs.length,
        covered: covered.length,
        notCovered: labs.length - covered.length,
        marksEarned,
        totalMarks: labs.length * 100,
        averageScore: covered.length ? round1(marksEarned / covered.length) : null,
      },
      labs,
      quizzes: Object.values(byQuiz).sort((a, b) => new Date(b.at) - new Date(a.at)),
    });
  }),
);

// ----------------------------------------------------------- live quiz

studentRouter.post(
  "/live/join",
  handle(async (req, res) => {
    const code = String(req.body?.code ?? "").replace(/\D/g, "");
    const session = code
      ? await prisma.quizSession.findUnique({
          where: { code },
          include: { quiz: { include: { audiences: true } } },
        })
      : null;
    if (!session || session.status === "DONE") {
      return res.status(404).json({ error: "No live quiz with that code" });
    }

    const { class: klass } = await myEnrollment(req.user.id);
    const audience = session.quiz.audiences.map((a) => a.classId);
    if (audience.length && !audience.includes(klass.id)) {
      return res.status(403).json({ error: "This quiz is for a different class" });
    }

    await prisma.quizParticipant.upsert({
      where: { sessionId_studentId: { sessionId: session.id, studentId: req.user.id } },
      create: { sessionId: session.id, studentId: req.user.id },
      update: {},
    });
    res.json({ session: await studentView(session.id, req.user.id) });
  }),
);

studentRouter.get(
  "/live/:sessionId",
  handle(async (req, res) => {
    res.json({ session: await studentView(req.params.sessionId, req.user.id) });
  }),
);

studentRouter.post(
  "/live/:sessionId/answer",
  handle(async (req, res) => {
    const session = await freshSession(req.params.sessionId);
    const me = session.participants.find((p) => p.studentId === req.user.id);
    if (!me) throw new HttpError(403, "Join the session first");
    if (session.status !== "QUESTION") throw new HttpError(409, "Time is up for this question");

    const question = session.quiz.questions[session.currentIndex];
    const already = await prisma.quizAnswer.findFirst({
      where: { sessionId: session.id, questionId: question.id, studentId: req.user.id },
    });
    if (already) throw new HttpError(409, "You have already answered");

    const given = { selectedIndex: req.body?.selectedIndex, value: req.body?.value };
    const isCorrect = gradeAnswer(question, given);
    const msTaken = Date.now() - session.questionStartedAt.getTime();
    const points = livePoints(question, isCorrect, msTaken);

    await prisma.quizAnswer.create({
      data: {
        quizId: session.quizId,
        questionId: question.id,
        studentId: req.user.id,
        sessionId: session.id,
        selectedIndex: Number.isInteger(given.selectedIndex) ? given.selectedIndex : null,
        value: given.value != null ? String(given.value).slice(0, 40) : null,
        isCorrect,
        points,
        msTaken,
      },
    });
    if (points) {
      await prisma.quizParticipant.update({ where: { id: me.id }, data: { points: { increment: points } } });
    }

    res.json({ session: await studentView(session.id, req.user.id) });
  }),
);
