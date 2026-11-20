// Live quiz sessions.
//
// No sockets: the host screen and every phone poll the session about once a
// second. The timer is derived from `questionStartedAt`, and a question moves
// to REVEAL on the first read after its time runs out (or once everyone in
// the room has answered), so the session advances even if the host is slow.

import { prisma } from "./prisma.js";
import { HttpError, initialsOf } from "./http.js";
import { publicQuestion } from "./quiz.js";

export async function makeSessionCode() {
  for (let i = 0; i < 20; i++) {
    const code = String(100000 + Math.floor(Math.random() * 900000));
    const clash = await prisma.quizSession.findUnique({ where: { code } });
    if (!clash) return code;
  }
  throw new HttpError(503, "Could not allocate a join code, try again");
}

async function loadSession(sessionId) {
  const session = await prisma.quizSession.findUnique({
    where: { id: sessionId },
    include: {
      quiz: {
        include: {
          questions: { orderBy: { number: "asc" } },
          audiences: { include: { class: true } },
        },
      },
      host: { select: { name: true } },
      participants: {
        include: { student: { select: { id: true, name: true } } },
        orderBy: { joinedAt: "asc" },
      },
    },
  });
  if (!session) throw new HttpError(404, "Session not found");
  return session;
}

function secondsLeft(session, question) {
  if (session.status !== "QUESTION" || !session.questionStartedAt || !question) return 0;
  const end = session.questionStartedAt.getTime() + question.seconds * 1000;
  return Math.max(0, Math.ceil((end - Date.now()) / 1000));
}

/** Loads a session, auto-revealing the current question if its time is up. */
export async function freshSession(sessionId) {
  let session = await loadSession(sessionId);
  if (session.status === "QUESTION") {
    const question = session.quiz.questions[session.currentIndex];
    const answered = await prisma.quizAnswer.count({
      where: { sessionId: session.id, questionId: question?.id },
    });
    const everyone = session.participants.length > 0 && answered >= session.participants.length;
    if (!question || secondsLeft(session, question) === 0 || everyone) {
      await prisma.quizSession.update({ where: { id: session.id }, data: { status: "REVEAL" } });
      session = await loadSession(sessionId);
    }
  }
  return session;
}

export async function transition(sessionId, action) {
  const session = await freshSession(sessionId);
  const total = session.quiz.questions.length;
  const now = new Date();

  if (session.status === "DONE") throw new HttpError(409, "This session has ended");

  let data;
  switch (action) {
    case "start":
      if (session.status !== "LOBBY") throw new HttpError(409, "The quiz has already started");
      if (!total) throw new HttpError(400, "This quiz has no questions");
      data = { status: "QUESTION", currentIndex: 0, questionStartedAt: now };
      break;
    case "reveal":
      if (session.status !== "QUESTION") throw new HttpError(409, "No question is open");
      data = { status: "REVEAL" };
      break;
    case "next":
      if (session.status !== "REVEAL") throw new HttpError(409, "Reveal the answer first");
      data =
        session.currentIndex + 1 >= total
          ? { status: "DONE", endedAt: now }
          : { status: "QUESTION", currentIndex: session.currentIndex + 1, questionStartedAt: now };
      break;
    case "end":
      data = { status: "DONE", endedAt: now };
      break;
    default:
      throw new HttpError(400, "Unknown action");
  }

  await prisma.quizSession.update({ where: { id: session.id }, data });
  if (data.status === "DONE") {
    await prisma.quiz.update({ where: { id: session.quizId }, data: { status: "DONE" } });
  }
  return freshSession(session.id);
}

function audienceLabel(audiences) {
  const byGrade = {};
  for (const a of audiences) (byGrade[a.class.grade] ??= []).push(a.class.section);
  return Object.entries(byGrade)
    .map(([g, secs]) => `Class ${g} · ${secs.sort().join(", ")}`)
    .join(" / ");
}

function leaderboard(session) {
  return [...session.participants]
    .sort((a, b) => b.points - a.points || a.joinedAt - b.joinedAt)
    .map((p, i) => ({
      rank: i + 1,
      studentId: p.student.id,
      name: p.student.name,
      initials: initialsOf(p.student.name),
      points: p.points,
    }));
}

/** What the teacher's host screen shows. */
export async function hostView(sessionId) {
  const session = await freshSession(sessionId);
  const questions = session.quiz.questions;
  const question = questions[session.currentIndex] || null;

  let counts = [];
  let answered = 0;
  if (question && session.status !== "LOBBY") {
    const answers = await prisma.quizAnswer.findMany({
      where: { sessionId: session.id, questionId: question.id },
      select: { selectedIndex: true, isCorrect: true },
    });
    answered = answers.length;
    if (question.type === "NUMERIC") {
      counts = [answers.filter((a) => a.isCorrect).length, answers.filter((a) => !a.isCorrect).length];
    } else {
      counts = question.options.map((_, i) => answers.filter((a) => a.selectedIndex === i).length);
    }
  }

  const revealed = session.status === "REVEAL" || session.status === "DONE";
  return {
    id: session.id,
    code: session.code,
    status: session.status,
    quiz: {
      id: session.quiz.id,
      title: session.quiz.title,
      questionCount: questions.length,
      audience: audienceLabel(session.quiz.audiences),
    },
    host: session.host?.name ?? null,
    joined: session.participants.length,
    names: session.participants.map((p) => p.student.name),
    question: question
      ? {
          ...publicQuestion(question),
          options: question.type === "NUMERIC" ? ["Correct", "Incorrect"] : question.options,
          correctIndex: revealed ? (question.type === "NUMERIC" ? 0 : question.correctIndex) : null,
          answer: revealed && question.type === "NUMERIC" ? question.options[0] : null,
          explanation: revealed ? question.explanation : null,
        }
      : null,
    index: session.currentIndex,
    secondsLeft: secondsLeft(session, question),
    counts,
    answered,
    isLast: session.currentIndex + 1 >= questions.length,
    leaderboard: leaderboard(session).slice(0, 10),
  };
}

/** What a student's phone shows. Never includes the key before the reveal. */
export async function studentView(sessionId, studentId) {
  const session = await freshSession(sessionId);
  const me = session.participants.find((p) => p.studentId === studentId);
  if (!me) throw new HttpError(403, "Join the session first");

  const question = session.quiz.questions[session.currentIndex] || null;
  const revealed = session.status === "REVEAL" || session.status === "DONE";
  const mine = question
    ? await prisma.quizAnswer.findFirst({
        where: { sessionId: session.id, questionId: question.id, studentId },
      })
    : null;

  const board = leaderboard(session);
  const myRank = board.find((b) => b.studentId === studentId)?.rank ?? null;

  return {
    id: session.id,
    status: session.status,
    title: session.quiz.title,
    questionCount: session.quiz.questions.length,
    index: session.currentIndex,
    joined: session.participants.length,
    secondsLeft: secondsLeft(session, question),
    question: question && session.status !== "LOBBY" ? publicQuestion(question) : null,
    myAnswer: mine
      ? { selectedIndex: mine.selectedIndex, value: mine.value, isCorrect: revealed ? mine.isCorrect : null, points: revealed ? mine.points : null }
      : null,
    reveal:
      revealed && question
        ? {
            correctIndex: question.type === "NUMERIC" ? null : question.correctIndex,
            answer: question.type === "NUMERIC" ? question.options[0] : null,
            explanation: question.explanation,
          }
        : null,
    me: { points: me.points, rank: myRank },
    leaderboard: session.quiz.showLeaderboard || session.status === "DONE" ? board.slice(0, 5) : [],
  };
}
