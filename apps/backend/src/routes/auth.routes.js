import { Router } from "express";
import { users } from "../data/store.js";

export const authRouter = Router();

// Login / Session retrieval
authRouter.post("/login", (req, res) => {
  const { email, name } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  let user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    user = {
      id: "user-" + Date.now(),
      name: name || email.split("@")[0].replace(/[._-]/g, " "),
      email,
      grade: "Class 10",
      board: "CBSE",
      xp: 100,
      streak: 1,
      bestStreak: 1,
      sessionsThisWeek: 1,
      completedLabIds: [],
    };
    users.push(user);
  }

  res.json({ success: true, user });
});

// Register
authRouter.post("/register", (req, res) => {
  const { name, email, grade, board } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required" });
  }

  let user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (user) {
    return res.status(400).json({ error: "User with this email already exists" });
  }

  user = {
    id: "user-" + Date.now(),
    name,
    email,
    grade: grade || "Class 10",
    board: board || "CBSE",
    xp: 150,
    streak: 1,
    bestStreak: 1,
    sessionsThisWeek: 1,
    completedLabIds: [],
  };
  users.push(user);

  res.status(201).json({ success: true, user });
});

// Get user profile
authRouter.get("/profile/:id", (req, res) => {
  const { id } = req.params;
  const user = users.find((u) => u.id === id) || users[0];
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json({ success: true, user });
});

// Update user XP
authRouter.post("/add-xp", (req, res) => {
  const { id, amount } = req.body;
  const user = users.find((u) => u.id === id) || users[0];
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  user.xp += Number(amount) || 0;
  res.json({ success: true, user });
});
