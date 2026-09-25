// Auto-scoring for a lab attempt.
//
// A student's mark out of 100 is built from three parts, so a student who only
// clicks through the quiz can't outrank one who actually worked the bench:
//
//   Quiz accuracy   50  — fraction of quiz questions answered correctly
//   Observations    30  — readings logged, capped at the lab's required count
//   Completion      20  — awarded once the attempt is submitted
//
// Submitting after the due date costs a flat late penalty. The teacher can
// always replace the result outright via overrideScore.

export const WEIGHTS = {
  quiz: 50,
  observations: 30,
  completion: 20,
};

export const LATE_PENALTY = 10;

/**
 * @param {object} attempt - needs quizScore, quizTotal, status, submittedAt
 * @param {number} observationCount
 * @param {number} requiredObservations
 * @param {Date|null} dueAt
 * @returns {{score: number, breakdown: object}}
 */
export function computeAutoScore(attempt, observationCount, requiredObservations, dueAt) {
  const required = Math.max(1, requiredObservations || 1);

  const quizRatio =
    attempt.quizTotal && attempt.quizTotal > 0
      ? (attempt.quizScore || 0) / attempt.quizTotal
      : 0;
  const quizPoints = WEIGHTS.quiz * quizRatio;

  const obsRatio = Math.min(1, observationCount / required);
  const observationPoints = WEIGHTS.observations * obsRatio;

  const submitted = attempt.status === "SUBMITTED";
  const completionPoints = submitted ? WEIGHTS.completion : 0;

  const isLate = Boolean(
    submitted && dueAt && attempt.submittedAt && new Date(attempt.submittedAt) > new Date(dueAt),
  );
  const latePenalty = isLate ? LATE_PENALTY : 0;

  const raw = quizPoints + observationPoints + completionPoints - latePenalty;
  const score = Math.max(0, Math.min(100, Math.round(raw * 10) / 10));

  return {
    score,
    breakdown: {
      quizPoints: round1(quizPoints),
      quizCorrect: attempt.quizScore || 0,
      quizTotal: attempt.quizTotal || 0,
      observationPoints: round1(observationPoints),
      observationCount,
      requiredObservations: required,
      completionPoints,
      latePenalty,
      isLate,
    },
  };
}

/** The mark that counts: a teacher override always beats the auto-score. */
export function finalScore(attempt) {
  if (attempt.overrideScore !== null && attempt.overrideScore !== undefined) {
    return attempt.overrideScore;
  }
  return attempt.autoScore ?? 0;
}

function round1(n) {
  return Math.round(n * 10) / 10;
}
