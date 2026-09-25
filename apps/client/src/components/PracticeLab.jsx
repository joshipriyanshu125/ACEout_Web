import { useState } from "react";

/**
 * Quiz runner. Questions come from the server WITHOUT the answer key — the
 * correct option and explanation only arrive in the grading response, so a
 * student can't read the answers out of the network tab.
 */
export function PracticeLab({ questions = [], labTitle, onSubmitAnswers, onNotify, onDone, onOpenBench }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showHint, setShowHint] = useState(false);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (questions.length === 0) {
    return (
      <section className="page practice-page">
        <div className="empty-state">
          No quiz loaded. Open a lab from <b>My Labs</b> and choose “Take quiz”.
          <button className="text-action-btn" onClick={onDone}>
            Back to my labs
          </button>
        </div>
      </section>
    );
  }

  const question = questions[currentIdx];
  const selectedOption = selectedAnswers[currentIdx];
  const isAnswered = selectedOption !== undefined;
  const isLast = currentIdx === questions.length - 1;

  const handleNext = async () => {
    setShowHint(false);
    if (!isLast) {
      setCurrentIdx(currentIdx + 1);
      return;
    }

    setSubmitting(true);
    const answers = questions.map((q, idx) => ({
      questionId: q.id,
      selectedIndex: selectedAnswers[idx] ?? -1,
    }));

    const data = await onSubmitAnswers(answers);
    setSubmitting(false);

    if (data) {
      setResult(data);
      onNotify(`Quiz submitted — ${data.score}/${data.total} correct.`);
    }
  };

  const handleRestart = () => {
    setSelectedAnswers({});
    setCurrentIdx(0);
    setResult(null);
    setShowHint(false);
  };

  // ------------------------------------------------------------- results
  if (result) {
    const byQuestion = Object.fromEntries(result.results.map((r) => [r.questionId, r]));
    const percent = Math.round((result.score / result.total) * 100);

    return (
      <section className="page practice-page">
        <div className="quiz-summary-card">
          <div className="summary-icon">{percent >= 75 ? "🎉" : percent >= 50 ? "👍" : "📖"}</div>
          <p className="eyebrow purple">QUIZ COMPLETE</p>
          <h1>{percent >= 75 ? "Great observation precision!" : "Worth another look."}</h1>
          <p className="subtitle">
            You scored{" "}
            <strong>
              {result.score} out of {result.total}
            </strong>
            {labTitle ? ` on ${labTitle}.` : "."}
          </p>

          <div className="score-pills">
            <div className="score-pill">
              <span>ACCURACY</span>
              <strong>{percent}%</strong>
            </div>
            <div className="score-pill">
              <span>XP REWARD</span>
              <strong>+{result.score * 25} XP</strong>
            </div>
            <div className="score-pill">
              <span>LAB SCORE SO FAR</span>
              <strong>{result.autoScore ?? "—"}%</strong>
            </div>
          </div>

          <div className="quiz-summary-actions">
            <button className="primary-action" onClick={onDone}>
              Back to my labs →
            </button>
            <button className="secondary-action" onClick={onOpenBench}>
              Go to the bench
            </button>
            <button className="secondary-action" onClick={handleRestart}>
              Retake quiz
            </button>
          </div>
        </div>

        {/* Per-question review, now that the server has released the answers */}
        <div className="quiz-answer-review">
          <h3>Review your answers</h3>
          {questions.map((q, idx) => {
            const r = byQuestion[q.id];
            const chosen = selectedAnswers[idx];
            return (
              <div key={q.id} className={`review-item ${r?.isCorrect ? "correct" : "wrong"}`}>
                <p className="review-q">
                  <b>Q{q.number}.</b> {q.title}
                </p>
                <p className="review-a">
                  {r?.isCorrect ? "✓" : "✕"} You chose:{" "}
                  <b>{chosen >= 0 ? q.options[chosen] : "nothing"}</b>
                  {!r?.isCorrect && r && (
                    <>
                      {" "}· Correct: <b>{q.options[r.correctIndex]}</b>
                    </>
                  )}
                </p>
                {r?.explanation && <p className="review-why">{r.explanation}</p>}
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  // ------------------------------------------------------------ question
  return (
    <section className="page practice-page">
      <div className="practice-head">
        <div>
          <button className="back-btn" onClick={onDone}>
            ← Back to my labs
          </button>
          <p className="eyebrow purple">
            {labTitle ? labTitle.toUpperCase() : `CHECKPOINT #${question.number}`}
          </p>
          <h1>Read the instrument with care.</h1>
          <p className="subtitle">{question.subtitle}</p>
        </div>

        <div className="xp-card">
          <span className="xp-star">✦</span>
          <strong>+25 XP</strong>
          <p>per correct answer</p>
        </div>
      </div>

      <div className="lab-layout">
        <section className="question-card">
          <div className="question-header">
            <div className="question-number">
              Question {String(question.number).padStart(2, "0")}{" "}
              <span>of {String(questions.length).padStart(2, "0")}</span>
            </div>
            <div className="progress-bar-thin">
              <span style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} />
            </div>
          </div>

          <h2>{question.title}</h2>

          <div className="instrument-box">
            <span className="instrument-tag">{question.instrumentType.toUpperCase()}</span>
            <strong className="instrument-digits">{question.displayValue}</strong>
            <p className="least-count-badge">{question.leastCount}</p>
          </div>

          <div className="options-grid">
            {question.options.map((choice, index) => {
              const isSelected = selectedOption === index;
              return (
                <button
                  key={choice}
                  className={`option-btn ${isSelected ? "selected" : ""}`}
                  onClick={() => setSelectedAnswers((prev) => ({ ...prev, [currentIdx]: index }))}
                >
                  <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                  <span className="option-text">{choice}</span>
                  {isSelected && <i className="check-icon">✓</i>}
                </button>
              );
            })}
          </div>

          <button
            className={`primary-action full ${!isAnswered ? "disabled" : ""}`}
            disabled={!isAnswered || submitting}
            onClick={handleNext}
          >
            {submitting ? "Submitting…" : isLast ? "Finish & submit →" : "Next question →"}
          </button>
        </section>

        <aside className="hint-card">
          <div className="hint-icon">⌁</div>
          <p className="eyebrow">A LITTLE NUDGE</p>
          <h3>{question.hintTitle}</h3>
          <p>{question.hintDescription}</p>

          {showHint ? (
            <div className="explanation-reveal">
              <strong>Think about:</strong>
              <p>{question.hintDescription}</p>
              <small>The full explanation unlocks once you submit.</small>
            </div>
          ) : (
            <button className="hint-toggle-btn" onClick={() => setShowHint(true)}>
              Need a bigger nudge? →
            </button>
          )}
        </aside>
      </div>
    </section>
  );
}
