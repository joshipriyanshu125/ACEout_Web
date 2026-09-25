import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import {
  hashPassword,
  verifyPassword,
  signToken,
  publicUser,
  requireAuth,
} from "../lib/auth.js";

export const authRouter = Router();

authRouter.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, role, grade, board, joinCode } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const normalisedEmail = String(email).trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normalisedEmail } });
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const requestedRole = role === "TEACHER" ? "TEACHER" : "STUDENT";

    const user = await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: normalisedEmail,
        passwordHash: await hashPassword(password),
        role: requestedRole,
        grade: grade || "Class 10",
        board: board || "CBSE",
      },
    });

    // Students may enrol straight away with a class join code.
    if (requestedRole === "STUDENT" && joinCode) {
      const klass = await prisma.class.findUnique({
        where: { joinCode: String(joinCode).trim().toUpperCase() },
      });
      if (klass) {
        await prisma.enrollment.create({ data: { classId: klass.id, studentId: user.id } });
      }
    }

    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email: String(email).trim().toLowerCase() },
    });

    // Same message either way so the form can't be used to enumerate accounts.
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).json({ error: "Incorrect email or password" });
    }

    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});
