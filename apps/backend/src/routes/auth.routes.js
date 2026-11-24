import { Router } from "express";
import { prisma } from "@repo/db";
import {
  hashPassword,
  verifyPassword,
  signToken,
  publicUser,
  requireAuth,
} from "../lib/auth.js";
import { handle } from "../lib/http.js";

export const authRouter = Router();

export const SCHOOL_NAME = process.env.SCHOOL_NAME || "Delhi Public School";

/** The student's section, shaped for the app. */
async function classOf(userId) {
  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId: userId },
    include: { class: { include: { teacher: { select: { name: true } } } } },
    orderBy: { joinedAt: "asc" },
  });
  if (!enrollment) return null;
  const c = enrollment.class;
  return {
    id: c.id,
    grade: c.grade,
    section: c.section,
    name: `Class ${c.grade} · Section ${c.section}`,
    board: c.board,
    teacher: c.teacher?.name ?? null,
  };
}

async function sessionPayload(user) {
  return {
    token: signToken(user),
    user: publicUser(user),
    school: SCHOOL_NAME,
    class: user.role === "STUDENT" ? await classOf(user.id) : null,
  };
}

/**
 * Student sign-up from the app's School/College mode. A class join code is
 * required: it is what puts the student into a section. Staff accounts are
 * created by the school, never self-registered.
 */
authRouter.post(
  "/register",
  handle(async (req, res) => {
    const { name, email, password, joinCode } = req.body ?? {};

    if (!name || !email || !password || !joinCode) {
      return res
        .status(400)
        .json({ error: "Name, email, password and class code are required" });
    }
    if (String(password).length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    const klass = await prisma.class.findUnique({
      where: { joinCode: String(joinCode).trim().toUpperCase() },
    });
    if (!klass || klass.archived) {
      return res.status(404).json({ error: "No class found with that code" });
    }

    const normalisedEmail = String(email).trim().toLowerCase();
    if (await prisma.user.findUnique({ where: { email: normalisedEmail } })) {
      return res
        .status(409)
        .json({ error: "An account with this email already exists" });
    }

    const rollNo =
      (await prisma.enrollment.count({ where: { classId: klass.id } })) + 1;
    const user = await prisma.user.create({
      data: {
        name: String(name).trim().slice(0, 60),
        email: normalisedEmail,
        passwordHash: await hashPassword(String(password)),
        role: "STUDENT",
        rollNo,
        lastActiveAt: new Date(),
        enrollments: { create: { classId: klass.id } },
      },
    });

    res.status(201).json(await sessionPayload(user));
  }),
);

authRouter.post(
  "/login",
  handle(async (req, res) => {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email: String(email).trim().toLowerCase() },
    });

    // Same message either way so the form can't be used to enumerate accounts.
    if (!user || !(await verifyPassword(String(password), user.passwordHash))) {
      return res.status(401).json({ error: "Incorrect email or password" });
    }

    res.json(await sessionPayload(user));
  }),
);

authRouter.get(
  "/me",
  requireAuth,
  handle(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    // A valid token for a user that no longer exists (e.g. after a DB reset)
    // is a dead session: 401 makes clients drop the token and show login.
    if (!user)
      return res
        .status(401)
        .json({ error: "Your session has expired. Please sign in again." });
    res.json({
      user: publicUser(user),
      school: SCHOOL_NAME,
      class: user.role === "STUDENT" ? await classOf(user.id) : null,
    });
  }),
);
