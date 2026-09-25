import { Router } from "express";
import { quests, users } from "../data/store.js";

export const questsRouter = Router();

// Get all quests
questsRouter.get("/", (req, res) => {
  res.json({ success: true, count: quests.length, quests });
});

// Claim quest reward
questsRouter.post("/claim", (req, res) => {
  const { questId, userId } = req.body;
  const quest = quests.find((q) => q.id === questId);

  if (!quest) {
    return res.status(404).json({ error: "Quest not found" });
  }

  if (quest.claimed) {
    return res.status(400).json({ error: "Quest reward already claimed" });
  }

  quest.claimed = true;
  quest.completed = true;

  // Add XP to user
  const user = users.find((u) => u.id === userId) || users[0];
  if (user) {
    user.xp += quest.xp;
  }

  res.json({ success: true, quest, user });
});

// Update quest progress
questsRouter.post("/progress", (req, res) => {
  const { questId, increment } = req.body;
  const quest = quests.find((q) => q.id === questId);

  if (!quest) {
    return res.status(404).json({ error: "Quest not found" });
  }

  quest.current = Math.min(quest.target, quest.current + (Number(increment) || 1));
  if (quest.current >= quest.target) {
    quest.completed = true;
  }

  res.json({ success: true, quest });
});
