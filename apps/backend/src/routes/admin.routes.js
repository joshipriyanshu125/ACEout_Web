// The admin panel's API.
//
// Staff only. ADMIN and PRINCIPAL see the whole school; a TEACHER sees the
// sections they teach. PRINCIPAL is read-only.

import { Router } from "express";
import { prisma } from "@repo/db";
import { requireAuth, requireRole, requireWrite, STAFF_ROLES } from "../lib/auth.js";
import { finalScore } from "@repo/db/scoring";
import { handle, HttpError, round1, pct, avg, initialsOf } from "../lib/http.js";
import { cleanQuestion } from "../lib/quiz.js";
import { makeSessionCode, hostView, transition } from "../lib/live.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole(...STAFF_ROLES));

const DAY = 24 * 3600 * 1000;
const HINT_LEVELS = ["GUIDED", "STANDARD", "EXAM"];

// ------------------------------------------------------------------ scope

function classWhere(req) {
  const where = { archived: false };
  if (req.user.role === "TEACHER") where.teacherId = req.user.id;
  return where;
}

/**
 * Everything the overview screens aggregate over, for the sections this user
 * can see. The school is small enough that one load and in-memory grouping is
 * simpler and faster than a dozen GROUP BYs.
 */
async function loadScope(req) {
  const classes = await prisma.class.findMany({
    where: classWhere(req),
    include: {
      teacher: { select: { id: true, name: true } },
      enrollments: { include: { student: { select: { id: true, name: true, xp: true, rollNo: true, lastActiveAt: true } } } },
    },
    orderBy: [{ grade: "asc" }, { section: "asc" }],
  });
  const classIds = classes.map((c) => c.id);
  const [assignments, attempts] = await Promise.all([
    prisma.assignment.findMany({
      where: { classId: { in: classIds }, closedAt: null },
      include: { lab: true },
    }),
    prisma.labAttempt.findMany({ where: { classId: { in: classIds } } }),
  ]);
  const open = new Set(assignments.map((a) => `${a.classId}|${a.labId}`));
  const liveAttempts = attempts.filter((a) => open.has(`${a.classId}|${a.labId}`));
  return { classes, classIds, assignments, attempts, liveAttempts };
}

async function classInScope(req, classId) {
  const klass = await prisma.class.findFirst({ where: { id: classId, ...classWhere(req) } });
  if (!klass) throw new HttpError(404, "Class not found");
  return klass;
}

/** Completion over assigned work: done / in progress / total slots. */
function progressFor(classList, assignments, attempts) {
  let slots = 0;
  for (const c of classList) {
    slots += c.enrollments.length * assignments.filter((a) => a.classId === c.id).length;
  }
  const ids = new Set(classList.map((c) => c.id));
  const mine = attempts.filter((a) => ids.has(a.classId));
  const done = mine.filter((a) => a.status === "SUBMITTED").length;
  const prog = mine.filter((a) => a.status === "IN_PROGRESS").length;
  return { slots, done, prog, donePct: pct(done, slots), progPct: pct(prog, slots) };
}

const quizPct = (a) => (a.quizTotal ? (a.quizScore / a.quizTotal) * 100 : null);

const sectionTag = (c) => `${c.grade}${c.section}`;

// -------------------------------------------------------------- dashboard

adminRouter.get(
  "/dashboard",
  handle(async (req, res) => {
    const { classes, classIds, assignments, attempts, liveAttempts } = await loadScope(req);
    const now = Date.now();
    const submitted = attempts.filter((a) => a.status === "SUBMITTED");
    const thisWeek = submitted.filter((a) => a.submittedAt && now - a.submittedAt.getTime() < 7 * DAY);
    const lastWeek = submitted.filter(
      (a) => a.submittedAt && now - a.submittedAt.getTime() >= 7 * DAY && now - a.submittedAt.getTime() < 14 * DAY,
    );

    const students = classes.flatMap((c) => c.enrollments.map((e) => e.student));
    const active24h = students.filter((s) => s.lastActiveAt && now - s.lastActiveAt.getTime() < DAY).length;

    const groups = groupAssignments(assignments, classes);
    const quizAvg = avg(submitted.map(quizPct));
    const overall = progressFor(classes, assignments, liveAttempts);

    const grades = [...new Set(classes.map((c) => c.grade))];
    const classProgress = grades.map((g) => {
      const p = progressFor(classes.filter((c) => c.grade === g), assignments, liveAttempts);
      return { grade: g, name: `Class ${g}`, donePct: p.donePct, progPct: p.progPct };
    });

    const dueSoon = groups
      .filter((g) => g.dueAt && g.dueAt.getTime() > now - 3 * DAY)
      .sort((a, b) => a.dueAt - b.dueAt)
      .slice(0, 4)
      .map((g) => ({
        ...publicGroup(g, liveAttempts, classes),
        overdue: g.dueAt.getTime() < now,
      }));

    const session = await prisma.quizSession.findFirst({
      where: {
        status: { not: "DONE" },
        ...(req.user.role === "TEACHER"
          ? { OR: [{ hostId: req.user.id }, { quiz: { audiences: { some: { classId: { in: classIds } } } } }] }
          : {}),
      },
      orderBy: { startedAt: "desc" },
    });
    const live = session ? await hostView(session.id) : null;

    const quizzes = await quizCards(req, { limit: 4, withResponsesOnly: true });

    res.json({
      stats: {
        labsCompleted: submitted.length,
        labsCompletedThisWeek: thisWeek.length,
        labsCompletedLastWeek: lastWeek.length,
        activeAssignments: groups.length,
        classesWithAssignments: new Set(groups.map((g) => g.grade)).size,
        avgQuiz: quizAvg === null ? null : Math.round(quizAvg),
        quizzesGraded: submitted.filter((a) => a.quizTotal).length,
        activeStudents: active24h,
        totalStudents: students.length,
      },
      week: { labsRun: thisWeek.length, donePct: overall.donePct },
      classProgress,
      dueSoon,
      live: live
        ? {
            id: live.id,
            title: live.quiz.title,
            audience: live.quiz.audience,
            host: live.host,
            joined: live.joined,
            index: live.index,
            status: live.status,
            questionCount: live.quiz.questionCount,
          }
        : null,
      recentQuizzes: quizzes,
    });
  }),
);

/** One row per lab × grade, across the sections it is assigned to. */
function groupAssignments(assignments, classes) {
  const classById = Object.fromEntries(classes.map((c) => [c.id, c]));
  const map = new Map();
  for (const a of assignments) {
    const c = classById[a.classId];
    if (!c) continue;
    const key = `${a.labId}|${c.grade}`;
    const g = map.get(key) ?? { lab: a.lab, grade: c.grade, classIds: [], sections: [], dueAt: null };
    g.classIds.push(c.id);
    g.sections.push(c.section);
    if (a.dueAt && (!g.dueAt || a.dueAt < g.dueAt)) g.dueAt = a.dueAt;
    map.set(key, g);
  }
  return [...map.values()];
}

function publicGroup(g, attempts, classes) {
  const inGroup = classes.filter((c) => g.classIds.includes(c.id));
  const slots = inGroup.reduce((s, c) => s + c.enrollments.length, 0);
  const done = attempts.filter(
    (a) => a.labId === g.lab.id && g.classIds.includes(a.classId) && a.status === "SUBMITTED",
  ).length;
  return {
    labId: g.lab.id,
    title: g.lab.title,
    subject: g.lab.subject,
    abbr: g.lab.abbr,
    grade: g.grade,
    sections: g.sections.sort(),
    dueAt: g.dueAt,
    students: slots,
    done,
    pct: pct(done, slots),
  };
}

// ---------------------------------------------------------------- classes

adminRouter.get(
  "/classes",
  handle(async (req, res) => {
    const { classes, assignments, liveAttempts } = await loadScope(req);
    const grades = [...new Set(classes.map((c) => c.grade))];
    res.json({
      grades: grades.map((g) => {
        const list = classes.filter((c) => c.grade === g);
        const p = progressFor(list, assignments, liveAttempts);
        return {
          grade: g,
          name: `Class ${g}`,
          students: list.reduce((s, c) => s + c.enrollments.length, 0),
          activeLabs: new Set(assignments.filter((a) => list.some((c) => c.id === a.classId)).map((a) => a.labId)).size,
          donePct: p.donePct,
          progPct: p.progPct,
          sections: list.map((c) => ({
            id: c.id,
            section: c.section,
            students: c.enrollments.length,
            teacher: c.teacher?.name ?? null,
            joinCode: c.joinCode,
          })),
        };
      }),
    });
  }),
);

adminRouter.get(
  "/classes/:grade",
  handle(async (req, res) => {
    const grade = Number(req.params.grade);
    const { classes, assignments, liveAttempts, attempts } = await loadScope(req);
    const list = classes.filter((c) => c.grade === grade);
    if (!list.length) throw new HttpError(404, "Class not found");

    const sections = list.map((c) => {
      const p = progressFor([c], assignments, liveAttempts);
      const subs = attempts.filter((a) => a.classId === c.id && a.status === "SUBMITTED");
      const quiz = avg(subs.map(quizPct));
      const xp = avg(c.enrollments.map((e) => e.student.xp));
      return {
        id: c.id,
        section: c.section,
        teacher: c.teacher?.name ?? null,
        students: c.enrollments.length,
        joinCode: c.joinCode,
        donePct: p.donePct,
        quizAvg: quiz === null ? null : Math.round(quiz),
        avgXp: xp === null ? 0 : Math.round(xp),
      };
    });

    const groups = groupAssignments(
      assignments.filter((a) => list.some((c) => c.id === a.classId)),
      list,
    ).map((g) => publicGroup(g, liveAttempts, list));

    res.json({ grade, name: `Class ${grade}`, sections, assignments: groups });
  }),
);

adminRouter.get(
  "/sections/:classId",
  handle(async (req, res) => {
    const klass = await classInScope(req, req.params.classId);
    const [teacher, enrollments, assignments, attempts] = await Promise.all([
      klass.teacherId ? prisma.user.findUnique({ where: { id: klass.teacherId }, select: { name: true } }) : null,
      prisma.enrollment.findMany({
        where: { classId: klass.id },
        include: { student: { select: { id: true, name: true, xp: true, rollNo: true, lastActiveAt: true } } },
      }),
      prisma.assignment.findMany({ where: { classId: klass.id, closedAt: null }, select: { labId: true } }),
      prisma.labAttempt.findMany({ where: { classId: klass.id } }),
    ]);
    const assigned = new Set(assignments.map((a) => a.labId));

    const students = enrollments
      .map(({ student }) => {
        const mine = attempts.filter((a) => a.studentId === student.id && assigned.has(a.labId));
        const subs = mine.filter((a) => a.status === "SUBMITTED");
        const precision = avg(subs.map((a) => a.precision));
        const quiz = avg(subs.map(quizPct));
        const score = avg(subs.map(finalScore));
        return {
          id: student.id,
          roll: student.rollNo,
          name: student.name,
          initials: initialsOf(student.name),
          xp: student.xp,
          labsDone: subs.length,
          labsTotal: assigned.size,
          precision: precision === null ? null : Math.round(precision),
          quizAvg: quiz === null ? null : Math.round(quiz),
          avgScore: score === null ? null : round1(score),
          lastActiveAt: student.lastActiveAt,
        };
      })
      .sort((a, b) => (a.roll ?? 999) - (b.roll ?? 999) || a.name.localeCompare(b.name));

    res.json({
      class: { id: klass.id, grade: klass.grade, section: klass.section, joinCode: klass.joinCode, teacher: teacher?.name ?? null },
      students,
    });
  }),
);

// ---------------------------------------------------------------- students

const BADGES = [
  { id: "first", name: "First bench", icon: "1", bg: "#4A7CF0", test: (s) => s.done >= 1 },
  { id: "steady", name: "Steady hand", icon: "✓", bg: "#2FA072", test: (s) => s.precision !== null && s.precision >= 90 },
  { id: "ace", name: "Quiz ace", icon: "A+", bg: "#7C5BD8", test: (s) => s.perfectQuiz },
  { id: "punctual", name: "Always on time", icon: "⏱", bg: "#E9A53A", test: (s) => s.done >= 2 && s.late === 0 },
  { id: "worlds", name: "Across subjects", icon: "3", bg: "#2B8FB5", test: (s) => s.subjects >= 3 },
  { id: "xp1k", name: "1,000 XP", icon: "1k", bg: "#E25C4C", test: (s) => s.xp >= 1000 },
];

adminRouter.get(
  "/students/:studentId",
  handle(async (req, res) => {
    const student = await prisma.user.findFirst({
      where: { id: req.params.studentId, role: "STUDENT" },
      select: { id: true, name: true, email: true, xp: true, rollNo: true, lastActiveAt: true },
    });
    if (!student) throw new HttpError(404, "Student not found");

    const enrollment = await prisma.enrollment.findFirst({
      where: { studentId: student.id },
      include: { class: true },
    });
    if (!enrollment) throw new HttpError(404, "Student is not in a class");
    const klass = await classInScope(req, enrollment.classId);

    const [assignments, attempts, liveAnswers] = await Promise.all([
      prisma.assignment.findMany({
        where: { classId: klass.id, closedAt: null },
        include: { lab: true },
        orderBy: [{ dueAt: "asc" }, { assignedAt: "asc" }],
      }),
      prisma.labAttempt.findMany({
        where: { studentId: student.id, classId: klass.id },
        include: {
          observations: { orderBy: { createdAt: "asc" } },
          lab: { select: { title: true, subject: true } },
          gradedBy: { select: { name: true } },
        },
      }),
      prisma.quizAnswer.findMany({
        where: { studentId: student.id, sessionId: { not: null } },
        include: { quiz: { select: { id: true, title: true } }, session: { select: { id: true, endedAt: true, startedAt: true } } },
      }),
    ]);
    const attemptByLab = Object.fromEntries(attempts.map((a) => [a.labId, a]));

    const labs = assignments.map((asg) => {
      const a = attemptByLab[asg.labId] || null;
      const done = a?.status === "SUBMITTED";
      return {
        labId: asg.labId,
        title: asg.lab.title,
        subject: asg.lab.subject,
        abbr: asg.lab.abbr,
        dueAt: asg.dueAt,
        status: !a ? "NOT_STARTED" : done ? "COMPLETED" : "IN_PROGRESS",
        precision: done ? a.precision : null,
        faults: done ? a.faults : null,
        quiz: done ? quizPct(a) : null,
        quizScore: a?.quizScore ?? null,
        quizTotal: a?.quizTotal ?? null,
        submittedAt: a?.submittedAt ?? null,
        timeSpentSeconds: a?.timeSpentSeconds ?? null,
        attempt: a
          ? {
              id: a.id,
              autoScore: a.autoScore,
              overrideScore: a.overrideScore,
              finalScore: done ? finalScore(a) : null,
              teacherRemark: a.teacherRemark,
              gradedBy: a.gradedBy?.name ?? null,
              late: Boolean(done && asg.dueAt && a.submittedAt > asg.dueAt),
              observations: a.observations.map((o) => o.readings),
            }
          : null,
      };
    });

    // Quiz scores: post-lab quizzes from attempts, plus live sessions.
    const quizzes = [];
    for (const a of attempts) {
      if (a.status === "SUBMITTED" && a.quizTotal) {
        quizzes.push({ title: `Post-lab · ${a.lab.title}`, mode: "After lab", score: Math.round(quizPct(a)), at: a.submittedAt });
      }
    }
    const bySession = {};
    for (const ans of liveAnswers) {
      const row = (bySession[ans.sessionId] ??= { title: ans.quiz.title, correct: 0, total: 0, at: ans.session.endedAt ?? ans.session.startedAt });
      row.total++;
      if (ans.isCorrect) row.correct++;
    }
    for (const s of Object.values(bySession)) {
      quizzes.push({ title: s.title, mode: "Live", score: pct(s.correct, s.total), at: s.at });
    }
    quizzes.sort((a, b) => new Date(b.at) - new Date(a.at));

    const subs = attempts.filter((a) => a.status === "SUBMITTED");
    const precision = avg(subs.map((a) => a.precision));
    const stats = {
      done: subs.length,
      precision: precision === null ? null : Math.round(precision),
      perfectQuiz: quizzes.some((q) => q.score === 100),
      late: labs.filter((l) => l.attempt?.late).length,
      subjects: new Set(subs.map((a) => a.lab.subject)).size,
      xp: student.xp,
    };

    res.json({
      student: { ...student, initials: initialsOf(student.name) },
      class: { id: klass.id, grade: klass.grade, section: klass.section },
      summary: {
        xp: student.xp,
        precision: stats.precision,
        faults: subs.reduce((s, a) => s + a.faults, 0),
        labsDone: subs.length,
        labsTotal: assignments.length,
        averageScore: subs.length ? round1(avg(subs.map(finalScore))) : null,
      },
      labs,
      quizzes: quizzes.slice(0, 8),
      badges: BADGES.filter((b) => b.test(stats)).map(({ id, name, icon, bg }) => ({ id, name, icon, bg })),
    });
  }),
);

/** Override the auto-score, and/or leave a remark the student will see. */
adminRouter.patch(
  "/attempts/:attemptId/grade",
  requireWrite,
  handle(async (req, res) => {
    const attempt = await prisma.labAttempt.findUnique({ where: { id: req.params.attemptId } });
    if (!attempt) throw new HttpError(404, "Attempt not found");
    await classInScope(req, attempt.classId);

    const { overrideScore, teacherRemark } = req.body ?? {};
    let score = null;
    if (overrideScore !== null && overrideScore !== undefined && overrideScore !== "") {
      score = Number(overrideScore);
      if (!Number.isFinite(score) || score < 0 || score > 100) {
        throw new HttpError(400, "Mark must be a number between 0 and 100");
      }
    }

    const updated = await prisma.labAttempt.update({
      where: { id: attempt.id },
      data: {
        overrideScore: score,
        teacherRemark: teacherRemark === undefined ? attempt.teacherRemark : String(teacherRemark).slice(0, 500) || null,
        gradedById: req.user.id,
        gradedAt: new Date(),
      },
    });
    res.json({ attempt: { ...updated, finalScore: finalScore(updated) } });
  }),
);

// -------------------------------------------------------------------- labs

adminRouter.get(
  "/labs",
  handle(async (req, res) => {
    const { classes, assignments } = await loadScope(req);
    const classById = Object.fromEntries(classes.map((c) => [c.id, c]));
    const [labs, quizzes] = await Promise.all([
      prisma.lab.findMany({ orderBy: { orderIndex: "asc" } }),
      prisma.quiz.findMany({
        where: { mode: "AFTER_LAB", labId: { not: null } },
        select: { id: true, labId: true, _count: { select: { questions: true } } },
      }),
    ]);
    res.json({
      labs: labs.map((lab) => {
        const mine = assignments.filter((a) => a.labId === lab.id);
        const upcoming = mine.map((a) => a.dueAt).filter(Boolean).sort((a, b) => a - b)[0] ?? null;
        const quiz = quizzes.find((q) => q.labId === lab.id);
        return {
          ...lab,
          assigned: mine.map((a) => sectionTag(classById[a.classId])).sort(),
          dueAt: upcoming,
          quiz: quiz ? { id: quiz.id, questions: quiz._count.questions } : null,
        };
      }),
    });
  }),
);

adminRouter.get(
  "/labs/:labId/report",
  handle(async (req, res) => {
    const lab = await prisma.lab.findUnique({ where: { id: req.params.labId } });
    if (!lab) throw new HttpError(404, "Lab not found");

    const { classes } = await loadScope(req);
    const assignments = await prisma.assignment.findMany({
      where: { labId: lab.id, closedAt: null, classId: { in: classes.map((c) => c.id) } },
    });
    const assignedClasses = classes.filter((c) => assignments.some((a) => a.classId === c.id));
    const scoped = req.query.classId
      ? assignedClasses.filter((c) => c.id === req.query.classId)
      : assignedClasses;

    const attempts = await prisma.labAttempt.findMany({
      where: { labId: lab.id, classId: { in: scoped.map((c) => c.id) } },
    });
    const byStudent = Object.fromEntries(attempts.map((a) => [`${a.classId}|${a.studentId}`, a]));

    const rows = scoped.flatMap((c) =>
      c.enrollments.map(({ student }) => {
        const a = byStudent[`${c.id}|${student.id}`] || null;
        const done = a?.status === "SUBMITTED";
        return {
          studentId: student.id,
          name: student.name,
          initials: initialsOf(student.name),
          section: c.section,
          grade: c.grade,
          status: !a ? "NOT_STARTED" : done ? "COMPLETED" : "IN_PROGRESS",
          precision: done ? a.precision : null,
          faults: done ? a.faults : null,
          quiz: done ? quizPct(a) : null,
          score: done ? finalScore(a) : null,
          timeSpentSeconds: done ? a.timeSpentSeconds : null,
          submittedAt: a?.submittedAt ?? null,
        };
      }),
    );
    const statusOrder = { COMPLETED: 0, IN_PROGRESS: 1, NOT_STARTED: 2 };
    rows.sort((a, b) => statusOrder[a.status] - statusOrder[b.status] || (b.score ?? 0) - (a.score ?? 0));

    const done = attempts.filter((a) => a.status === "SUBMITTED");
    const precision = avg(done.map((a) => a.precision));
    const quiz = avg(done.map(quizPct));
    const time = avg(done.map((a) => a.timeSpentSeconds || null));

    // Where students slipped: share of finishers who faulted at each step.
    const stepCounts = {};
    for (const a of done) {
      for (const step of new Set(Array.isArray(a.faultSteps) ? a.faultSteps : [])) {
        stepCounts[step] = (stepCounts[step] || 0) + 1;
      }
    }
    const faultSpots = Object.entries(stepCounts)
      .map(([step, n]) => ({ step, pct: pct(n, done.length) }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 5);

    const afterLab = await prisma.quiz.findFirst({
      where: { labId: lab.id, mode: "AFTER_LAB" },
      select: { id: true, _count: { select: { questions: true } } },
    });
    const due = assignments
      .filter((a) => scoped.some((c) => c.id === a.classId))
      .map((a) => a.dueAt)
      .filter(Boolean)
      .sort((a, b) => a - b)[0] ?? null;

    res.json({
      lab,
      dueAt: due,
      sections: assignedClasses.map((c) => ({ id: c.id, grade: c.grade, section: c.section })),
      stats: {
        completed: done.length,
        total: rows.length,
        precision: precision === null ? null : Math.round(precision),
        quiz: quiz === null ? null : Math.round(quiz),
        avgMinutes: time === null ? null : Math.round(time / 60),
        targetMinutes: lab.durationMinutes,
      },
      rows,
      faultSpots,
      quiz: afterLab ? { id: afterLab.id, questions: afterLab._count.questions } : null,
    });
  }),
);

adminRouter.post(
  "/assignments",
  requireWrite,
  handle(async (req, res) => {
    const { labId, classIds, dueAt, hintLevel, attachQuiz, allowOffline } = req.body ?? {};
    const lab = labId ? await prisma.lab.findUnique({ where: { id: labId } }) : null;
    if (!lab) throw new HttpError(404, "Lab not found");
    if (!Array.isArray(classIds) || !classIds.length) throw new HttpError(400, "Pick at least one section");

    const due = dueAt ? new Date(dueAt) : null;
    if (due && Number.isNaN(due.getTime())) throw new HttpError(400, "Invalid due date");
    // A bare date means "by the end of that day".
    if (due && /^\d{4}-\d{2}-\d{2}$/.test(String(dueAt))) due.setHours(23, 59, 0, 0);

    const classes = await prisma.class.findMany({
      where: { id: { in: classIds }, ...classWhere(req) },
      include: { _count: { select: { enrollments: true } } },
    });
    if (classes.length !== new Set(classIds).size) throw new HttpError(403, "You can't assign to one of those sections");

    const data = {
      dueAt: due,
      hintLevel: HINT_LEVELS.includes(hintLevel) ? hintLevel : "STANDARD",
      attachQuiz: attachQuiz !== false,
      allowOffline: allowOffline !== false,
      assignedById: req.user.id,
    };
    for (const c of classes) {
      await prisma.assignment.upsert({
        where: { classId_labId: { classId: c.id, labId: lab.id } },
        create: { classId: c.id, labId: lab.id, ...data },
        update: { ...data, closedAt: null, assignedAt: new Date() },
      });
    }

    res.status(201).json({
      assigned: classes.length,
      students: classes.reduce((s, c) => s + c._count.enrollments, 0),
    });
  }),
);

adminRouter.delete(
  "/assignments",
  requireWrite,
  handle(async (req, res) => {
    const { labId, classId } = req.body ?? {};
    await classInScope(req, classId);
    const existing = await prisma.assignment.findUnique({ where: { classId_labId: { classId, labId } } });
    if (!existing || existing.closedAt) throw new HttpError(404, "That lab is not assigned to this section");
    await prisma.assignment.update({ where: { id: existing.id }, data: { closedAt: new Date() } });
    res.json({ ok: true });
  }),
);

// ----------------------------------------------------------------- quizzes

function quizWhere(req, classIds) {
  if (req.user.role !== "TEACHER") return {};
  return {
    OR: [
      { createdById: req.user.id },
      { mode: "AFTER_LAB" },
      { audiences: { some: { classId: { in: classIds } } } },
    ],
  };
}

async function teacherClassIds(req) {
  if (req.user.role !== "TEACHER") return null;
  const mine = await prisma.class.findMany({ where: classWhere(req), select: { id: true } });
  return mine.map((c) => c.id);
}

function audienceText(quiz, assignedTags) {
  const classes = quiz.audiences.map((a) => a.class);
  if (!classes.length && quiz.mode === "AFTER_LAB") {
    if (!assignedTags.length) return "Not assigned yet";
    classes.push(...assignedTags);
  }
  if (!classes.length) return "No audience yet";
  const byGrade = {};
  for (const c of classes) (byGrade[c.grade] ??= new Set()).add(c.section);
  return Object.entries(byGrade)
    .map(([g, s]) => `Class ${g} · ${[...s].sort().join(", ")}`)
    .join(" / ");
}

/** Average % and response count per quiz, scoped to classIds when given. */
async function quizStats(quizzes, classIds) {
  const out = {};
  const afterLab = quizzes.filter((q) => q.mode === "AFTER_LAB" && q.labId);
  const live = quizzes.filter((q) => q.mode === "LIVE");

  if (afterLab.length) {
    const attempts = await prisma.labAttempt.findMany({
      where: {
        labId: { in: afterLab.map((q) => q.labId) },
        status: "SUBMITTED",
        quizTotal: { not: null },
        ...(classIds ? { classId: { in: classIds } } : {}),
      },
      select: { labId: true, quizScore: true, quizTotal: true, submittedAt: true },
    });
    for (const q of afterLab) {
      const mine = attempts.filter((a) => a.labId === q.labId);
      const last = mine.map((a) => a.submittedAt).sort((a, b) => b - a)[0] ?? null;
      out[q.id] = { avg: mine.length ? Math.round(avg(mine.map(quizPct))) : null, n: mine.length, lastAt: last };
    }
  }

  if (live.length) {
    const answers = await prisma.quizAnswer.findMany({
      where: { quizId: { in: live.map((q) => q.id) }, sessionId: { not: null } },
      select: { quizId: true, sessionId: true, studentId: true, isCorrect: true, answeredAt: true },
    });
    for (const q of live) {
      const mine = answers.filter((a) => a.quizId === q.id);
      const per = {};
      for (const a of mine) {
        const k = `${a.sessionId}|${a.studentId}`;
        (per[k] ??= { correct: 0 }).correct += a.isCorrect ? 1 : 0;
      }
      const scores = Object.values(per).map((p) => (p.correct / Math.max(1, q._count.questions)) * 100);
      const last = mine.map((a) => a.answeredAt).sort((a, b) => b - a)[0] ?? null;
      out[q.id] = { avg: scores.length ? Math.round(avg(scores)) : null, n: scores.length, lastAt: last };
    }
  }
  return out;
}

async function quizCards(req, { limit, withResponsesOnly } = {}) {
  const classIds = await teacherClassIds(req);
  const quizzes = await prisma.quiz.findMany({
    where: quizWhere(req, classIds ?? []),
    include: {
      audiences: { include: { class: { select: { grade: true, section: true } } } },
      lab: { select: { title: true } },
      sessions: { where: { status: { not: "DONE" } }, select: { id: true, status: true } },
      _count: { select: { questions: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
  const stats = await quizStats(quizzes, classIds);

  const assigned = await prisma.assignment.findMany({
    where: {
      closedAt: null,
      labId: { in: quizzes.map((q) => q.labId).filter(Boolean) },
      ...(classIds ? { classId: { in: classIds } } : {}),
    },
    include: { class: { select: { grade: true, section: true } } },
  });

  let cards = quizzes.map((q) => {
    const s = stats[q.id] ?? { avg: null, n: 0, lastAt: null };
    const running = q.sessions[0] ?? null;
    const state = running ? "live" : q.mode === "AFTER_LAB" ? "auto" : q.status === "DRAFT" ? "draft" : q.status === "DONE" ? "done" : "ready";
    return {
      id: q.id,
      title: q.title,
      mode: q.mode,
      state,
      liveSessionId: running?.id ?? null,
      labId: q.labId,
      labTitle: q.lab?.title ?? null,
      who: audienceText(q, assigned.filter((a) => a.labId === q.labId).map((a) => a.class)),
      questions: q._count.questions,
      avg: s.avg,
      responses: s.n,
      lastResponseAt: s.lastAt,
      updatedAt: q.updatedAt,
      reportsSentAt: q.reportsSentAt,
    };
  });
  if (withResponsesOnly) {
    cards = cards
      .filter((c) => c.responses > 0)
      .sort((a, b) => new Date(b.lastResponseAt) - new Date(a.lastResponseAt));
  }
  return limit ? cards.slice(0, limit) : cards;
}

adminRouter.get(
  "/quizzes",
  handle(async (req, res) => {
    res.json({ quizzes: await quizCards(req) });
  }),
);

async function quizInScope(req, id) {
  const classIds = await teacherClassIds(req);
  const quiz = await prisma.quiz.findFirst({
    where: { id, ...quizWhere(req, classIds ?? []) },
    include: {
      questions: { orderBy: { number: "asc" } },
      audiences: { include: { class: { select: { id: true, grade: true, section: true } } } },
      lab: { select: { id: true, title: true } },
    },
  });
  if (!quiz) throw new HttpError(404, "Quiz not found");
  return { quiz, classIds };
}

adminRouter.get(
  "/quizzes/:id",
  handle(async (req, res) => {
    const { quiz } = await quizInScope(req, req.params.id);
    res.json({
      quiz: {
        ...quiz,
        audience: quiz.audiences.map((a) => a.class),
        audiences: undefined,
      },
    });
  }),
);

async function writeQuiz(req, existing) {
  const body = req.body ?? {};
  const title = String(body.title ?? "").trim().slice(0, 120);
  if (!title) throw new HttpError(400, "Give the quiz a title");
  const mode = body.mode === "AFTER_LAB" ? "AFTER_LAB" : "LIVE";
  const questions = (Array.isArray(body.questions) ? body.questions : []).map((q, i) => cleanQuestion(q, i + 1));
  if (!questions.length) throw new HttpError(400, "Add at least one question");
  const empty = questions.findIndex((q) => !q.text.trim());
  if (empty !== -1) throw new HttpError(400, `Question ${empty + 1} has no text`);

  const labId = body.labId || null;
  if (labId && !(await prisma.lab.findUnique({ where: { id: labId } }))) throw new HttpError(400, "Unknown lab");
  if (mode === "AFTER_LAB" && !labId) throw new HttpError(400, "An after-lab quiz needs a linked lab");

  const audience = Array.isArray(body.audience) ? body.audience : [];
  if (audience.length) {
    const ok = await prisma.class.count({ where: { id: { in: audience }, ...classWhere(req) } });
    if (ok !== new Set(audience).size) throw new HttpError(403, "You can't target one of those sections");
  }

  const data = {
    title,
    mode,
    labId,
    status: body.status === "DRAFT" ? "DRAFT" : "READY",
    shuffle: body.shuffle !== false,
    showLeaderboard: body.showLeaderboard !== false,
  };

  return prisma.$transaction(async (tx) => {
    const quiz = existing
      ? await tx.quiz.update({ where: { id: existing.id }, data })
      : await tx.quiz.create({ data: { ...data, createdById: req.user.id } });

    // Update questions in place by number so existing answers survive edits.
    const current = existing ? await tx.quizQuestion.findMany({ where: { quizId: quiz.id } }) : [];
    for (const q of questions) {
      const match = current.find((c) => c.number === q.number);
      if (match) await tx.quizQuestion.update({ where: { id: match.id }, data: q });
      else await tx.quizQuestion.create({ data: { ...q, quizId: quiz.id } });
    }
    await tx.quizQuestion.deleteMany({ where: { quizId: quiz.id, number: { gt: questions.length } } });

    await tx.quizAudience.deleteMany({ where: { quizId: quiz.id } });
    if (audience.length) {
      await tx.quizAudience.createMany({ data: [...new Set(audience)].map((classId) => ({ quizId: quiz.id, classId })) });
    }
    return quiz;
  });
}

adminRouter.post(
  "/quizzes",
  requireWrite,
  handle(async (req, res) => {
    const quiz = await writeQuiz(req, null);
    res.status(201).json({ quiz: { id: quiz.id } });
  }),
);

adminRouter.put(
  "/quizzes/:id",
  requireWrite,
  handle(async (req, res) => {
    const { quiz: existing } = await quizInScope(req, req.params.id);
    const running = await prisma.quizSession.count({ where: { quizId: existing.id, status: { not: "DONE" } } });
    if (running) throw new HttpError(409, "End the live session before editing this quiz");
    const quiz = await writeQuiz(req, existing);
    res.json({ quiz: { id: quiz.id } });
  }),
);

adminRouter.delete(
  "/quizzes/:id",
  requireWrite,
  handle(async (req, res) => {
    const { quiz } = await quizInScope(req, req.params.id);
    await prisma.quiz.delete({ where: { id: quiz.id } });
    res.json({ ok: true });
  }),
);

adminRouter.post(
  "/quizzes/:id/send-reports",
  requireWrite,
  handle(async (req, res) => {
    const { quiz } = await quizInScope(req, req.params.id);
    const updated = await prisma.quiz.update({ where: { id: quiz.id }, data: { reportsSentAt: new Date() } });
    res.json({ reportsSentAt: updated.reportsSentAt });
  }),
);

function median(values) {
  const list = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!list.length) return null;
  const mid = Math.floor(list.length / 2);
  return list.length % 2 ? list[mid] : (list[mid - 1] + list[mid]) / 2;
}

adminRouter.get(
  "/quizzes/:id/results",
  handle(async (req, res) => {
    const { quiz, classIds } = await quizInScope(req, req.params.id);
    const questions = quiz.questions;
    const scopeIds = classIds ?? (await prisma.class.findMany({ where: { archived: false }, select: { id: true } })).map((c) => c.id);

    let rows = [];
    let answers = [];
    let assignedCount;
    let session = null;

    if (quiz.mode === "AFTER_LAB") {
      const attempts = await prisma.labAttempt.findMany({
        where: { labId: quiz.labId, status: "SUBMITTED", quizTotal: { not: null }, classId: { in: scopeIds } },
        include: { student: { select: { id: true, name: true } }, class: { select: { grade: true, section: true } } },
      });
      answers = await prisma.quizAnswer.findMany({
        where: { quizId: quiz.id, attemptId: { in: attempts.map((a) => a.id) } },
      });
      rows = attempts.map((a) => {
        const mine = answers.filter((x) => x.attemptId === a.id);
        return {
          studentId: a.student.id,
          name: a.student.name,
          initials: initialsOf(a.student.name),
          section: a.class.section,
          grade: a.class.grade,
          score: Math.round(quizPct(a)),
          correct: a.quizScore,
          total: a.quizTotal,
          points: mine.reduce((s, x) => s + x.points, 0),
          at: a.submittedAt,
        };
      });
      const asg = await prisma.assignment.findMany({
        where: { labId: quiz.labId, closedAt: null, attachQuiz: true, classId: { in: scopeIds } },
        include: { class: { include: { _count: { select: { enrollments: true } } } } },
      });
      assignedCount = asg.reduce((s, a) => s + a.class._count.enrollments, 0);
    } else {
      session = await prisma.quizSession.findFirst({
        // Without an explicit session, show the latest run anyone took part in.
        where: {
          quizId: quiz.id,
          ...(req.query.sessionId ? { id: String(req.query.sessionId) } : { participants: { some: {} } }),
        },
        orderBy: [{ startedAt: "desc" }],
        include: {
          participants: {
            include: {
              student: {
                select: { id: true, name: true, enrollments: { include: { class: { select: { grade: true, section: true } } } } },
              },
            },
          },
        },
      });
      if (session) {
        answers = await prisma.quizAnswer.findMany({ where: { sessionId: session.id } });
        rows = session.participants.map((p) => {
          const mine = answers.filter((x) => x.studentId === p.studentId);
          const correct = mine.filter((x) => x.isCorrect).length;
          const c = p.student.enrollments[0]?.class;
          return {
            studentId: p.student.id,
            name: p.student.name,
            initials: initialsOf(p.student.name),
            section: c?.section ?? "—",
            grade: c?.grade ?? null,
            score: pct(correct, questions.length),
            correct,
            total: questions.length,
            points: p.points,
            at: session.endedAt ?? session.startedAt,
          };
        });
      }
      const audienceIds = quiz.audiences.map((a) => a.class.id);
      assignedCount = audienceIds.length
        ? await prisma.enrollment.count({ where: { classId: { in: audienceIds } } })
        : rows.length;
    }

    rows.sort((a, b) => b.points - a.points || b.score - a.score);
    rows = rows.map((r, i) => ({ ...r, rank: i + 1 }));

    const accuracy = questions.map((q) => {
      const mine = answers.filter((a) => a.questionId === q.id);
      const right = mine.filter((a) => a.isCorrect).length;
      const wrong = mine.filter((a) => !a.isCorrect);
      const tally = {};
      for (const w of wrong) {
        const label = q.type === "NUMERIC" ? (w.value ?? "") : (q.options[w.selectedIndex] ?? "");
        if (label !== "") tally[label] = (tally[label] || 0) + 1;
      }
      const commonWrong = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      return { number: q.number, text: q.text, pct: mine.length ? pct(right, mine.length) : null, answered: mine.length, commonWrong };
    });
    const answeredQs = accuracy.filter((a) => a.pct !== null);
    const hardest = answeredQs.length ? answeredQs.reduce((a, b) => (b.pct < a.pct ? b : a)) : null;

    const allStats = await quizStats(
      await prisma.quiz.findMany({ include: { _count: { select: { questions: true } } } }),
      classIds,
    );
    const schoolAvg = avg(Object.values(allStats).map((s) => s.avg));
    const scoreAvg = avg(rows.map((r) => r.score));
    const medianMs = median(answers.map((a) => a.msTaken));

    res.json({
      quiz: {
        id: quiz.id,
        title: quiz.title,
        mode: quiz.mode,
        labId: quiz.labId,
        questions: questions.length,
        who: audienceText(
          quiz,
          quiz.mode === "AFTER_LAB"
            ? (
                await prisma.assignment.findMany({
                  where: { labId: quiz.labId, closedAt: null, classId: { in: scopeIds } },
                  include: { class: { select: { grade: true, section: true } } },
                })
              ).map((a) => a.class)
            : [],
        ),
        reportsSentAt: quiz.reportsSentAt,
      },
      session: session ? { id: session.id, startedAt: session.startedAt, endedAt: session.endedAt, status: session.status } : null,
      stats: {
        avg: scoreAvg === null ? null : Math.round(scoreAvg),
        schoolAvg: schoolAvg === null ? null : Math.round(schoolAvg),
        responses: rows.length,
        assigned: Math.max(assignedCount, rows.length),
        hardest: hardest ? { number: hardest.number, pct: hardest.pct } : null,
        medianSeconds: medianMs === null ? null : Math.round(medianMs / 100) / 10,
      },
      rows,
      accuracy,
      lowCount: rows.filter((r) => r.score < 50).length,
    });
  }),
);

// ------------------------------------------------------------ live hosting

adminRouter.post(
  "/quizzes/:id/sessions",
  requireWrite,
  handle(async (req, res) => {
    const { quiz } = await quizInScope(req, req.params.id);
    if (quiz.mode !== "LIVE") throw new HttpError(400, "Only live quizzes can be hosted");
    if (!quiz.questions.length) throw new HttpError(400, "Add questions before hosting");

    const open = await prisma.quizSession.findFirst({
      where: { quizId: quiz.id, status: { not: "DONE" } },
    });
    const session =
      open ??
      (await prisma.quizSession.create({
        data: { quizId: quiz.id, code: await makeSessionCode(), hostId: req.user.id },
      }));
    if (quiz.status === "DRAFT" || quiz.status === "DONE") {
      await prisma.quiz.update({ where: { id: quiz.id }, data: { status: "READY" } });
    }
    res.status(open ? 200 : 201).json({ session: await hostView(session.id) });
  }),
);

async function sessionInScope(req, id) {
  const session = await prisma.quizSession.findUnique({ where: { id }, select: { id: true, quizId: true } });
  if (!session) throw new HttpError(404, "Session not found");
  await quizInScope(req, session.quizId);
  return session;
}

adminRouter.get(
  "/sessions/:id",
  handle(async (req, res) => {
    await sessionInScope(req, req.params.id);
    res.json({ session: await hostView(req.params.id) });
  }),
);

adminRouter.post(
  "/sessions/:id/:action(start|reveal|next|end)",
  requireWrite,
  handle(async (req, res) => {
    await sessionInScope(req, req.params.id);
    await transition(req.params.id, req.params.action);
    res.json({ session: await hostView(req.params.id) });
  }),
);

// --------------------------------------------------------------- reference

/** Sections and labs for pickers (assign modal, quiz builder). */
adminRouter.get(
  "/options",
  handle(async (req, res) => {
    const [classes, labs] = await Promise.all([
      prisma.class.findMany({
        where: classWhere(req),
        include: { _count: { select: { enrollments: true } } },
        orderBy: [{ grade: "asc" }, { section: "asc" }],
      }),
      prisma.lab.findMany({ orderBy: { orderIndex: "asc" }, select: { id: true, title: true, grade: true, subject: true } }),
    ]);
    res.json({
      sections: classes.map((c) => ({ id: c.id, grade: c.grade, section: c.section, students: c._count.enrollments })),
      labs,
    });
  }),
);
