import { Router } from "express";
import { observations, quests } from "../data/store.js";

export const observationsRouter = Router();

// Get all observations
observationsRouter.get("/", (req, res) => {
  res.json({ success: true, count: observations.length, observations });
});

// Save a new observation
observationsRouter.post("/", (req, res) => {
  const { experimentId, experimentTitle, readings, notes } = req.body;

  if (!experimentId || !experimentTitle || !readings) {
    return res.status(400).json({ error: "Missing required fields for observation" });
  }

  const newEntry = {
    id: "obs-" + Date.now(),
    experimentId,
    experimentTitle,
    timestamp: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      month: "short",
      day: "numeric",
    }),
    readings,
    notes,
  };

  observations.unshift(newEntry);

  // Update logging readings quest
  const quest2 = quests.find((q) => q.id === "quest-2");
  if (quest2) {
    quest2.current = Math.min(quest2.target, quest2.current + 1);
    if (quest2.current >= quest2.target) quest2.completed = true;
  }

  res.status(201).json({ success: true, observation: newEntry, observations });
});

// Delete an observation
observationsRouter.delete("/:id", (req, res) => {
  const { id } = req.params;
  const index = observations.findIndex((o) => o.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Observation not found" });
  }

  const [removed] = observations.splice(index, 1);
  res.json({ success: true, removed, observations });
});
