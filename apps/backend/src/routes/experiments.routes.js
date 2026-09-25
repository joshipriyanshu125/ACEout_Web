import { Router } from "express";
import { experiments } from "../data/store.js";

export const experimentsRouter = Router();

// Get all experiments
experimentsRouter.get("/", (req, res) => {
  const { subject, grade } = req.query;
  let list = experiments;

  if (subject) {
    list = list.filter((e) => e.subject === subject);
  }
  if (grade) {
    list = list.filter((e) => e.grade.toLowerCase().includes(String(grade).toLowerCase()));
  }

  res.json({ success: true, count: list.length, experiments: list });
});

// Get experiment by ID
experimentsRouter.get("/:id", (req, res) => {
  const { id } = req.params;
  const experiment = experiments.find((e) => e.id === id);
  if (!experiment) {
    return res.status(404).json({ error: "Experiment not found" });
  }
  res.json({ success: true, experiment });
});
