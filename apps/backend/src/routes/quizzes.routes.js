import { Router } from "express";
import { quizQuestions } from "../data/store.js";

export const quizzesRouter = Router();

// Get all quiz questions
quizzesRouter.get("/", (req, res) => {
  res.json({ success: true, count: quizQuestions.length, questions: quizQuestions });
});

// Verify answer
quizzesRouter.post("/verify", (req, res) => {
  const { questionId, selectedIndex } = req.body;
  const question = quizQuestions.find((q) => q.id === questionId);

  if (!question) {
    return res.status(404).json({ error: "Question not found" });
  }

  const isCorrect = question.correctIndex === selectedIndex;
  res.json({
    success: true,
    isCorrect,
    correctIndex: question.correctIndex,
    explanation: question.explanation,
  });
});
