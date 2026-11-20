// Grading for quiz questions, shared by post-lab quizzes and live sessions.

/** Numeric answers count if they land within 1 % of the key (or 0.01 absolute). */
const NUMERIC_TOLERANCE = 0.01;

export function gradeAnswer(question, { selectedIndex, value }) {
  if (question.type === "NUMERIC") {
    const expected = Number(String(question.options?.[0] ?? "").replace(/[^\d.eE+-]/g, ""));
    const given = Number(String(value ?? "").replace(/[^\d.eE+-]/g, ""));
    if (!Number.isFinite(expected) || !Number.isFinite(given) || String(value ?? "").trim() === "") {
      return false;
    }
    const tolerance = Math.max(NUMERIC_TOLERANCE, Math.abs(expected) * NUMERIC_TOLERANCE);
    return Math.abs(given - expected) <= tolerance;
  }
  return Number(selectedIndex) === question.correctIndex;
}

/**
 * Live-quiz points: a correct answer is worth between half and all of the
 * question's points, depending on how much of the timer was left.
 */
export function livePoints(question, isCorrect, msTaken) {
  if (!isCorrect) return 0;
  const limit = Math.max(1, question.seconds) * 1000;
  const left = Math.max(0, Math.min(1, 1 - (msTaken ?? limit) / limit));
  return Math.round(question.points * (0.5 + 0.5 * left));
}

/** What a student may see of a question before it has been answered. */
export function publicQuestion(q) {
  return {
    id: q.id,
    number: q.number,
    text: q.text,
    type: q.type,
    options: q.type === "NUMERIC" ? [] : q.options,
    seconds: q.seconds,
    points: q.points,
  };
}

/** Normalises a question coming from the admin builder. */
export function cleanQuestion(raw, number) {
  const type = ["MCQ", "TRUE_FALSE", "NUMERIC"].includes(raw?.type) ? raw.type : "MCQ";
  let options = Array.isArray(raw?.options) ? raw.options.map((o) => String(o ?? "").slice(0, 200)) : [];
  if (type === "TRUE_FALSE") options = ["True", "False"];
  if (type === "NUMERIC") options = [String(options[0] ?? "")];
  if (type === "MCQ" && options.length < 2) options = [...options, "", ""].slice(0, Math.max(2, options.length));
  const correctIndex = type === "NUMERIC" ? 0 : clampInt(raw?.correctIndex, 0, options.length - 1, 0);
  return {
    number,
    text: String(raw?.text ?? "").slice(0, 500),
    type,
    options,
    correctIndex,
    explanation: String(raw?.explanation ?? "").slice(0, 500),
    seconds: clampInt(raw?.seconds, 5, 300, 20),
    points: clampInt(raw?.points, 0, 2000, 100),
  };
}

function clampInt(v, min, max, fallback) {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}
