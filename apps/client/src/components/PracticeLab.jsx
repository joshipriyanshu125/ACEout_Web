import { useState } from "react";
import { QUIZ_QUESTIONS } from "../services/storage.js";

export function PracticeLab({ onCompleteQuiz, onNotify, onOpenBench }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showHint, setShowHint] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);

  const question = QUIZ_QUESTIONS[currentIdx];
  const selectedOption = selectedAnswers[currentIdx];
  const isAnswered = selectedOption !== undefined;

  const handleSelectOption = (index) => {
    if (quizFinished) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentIdx]: index }));
  };

  const handleNext = () => {
    setShowHint(false);
    if (currentIdx < QUIZ_QUESTIONS.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      // Calculate score
      let correct = 0;
      QUIZ_QUESTIONS.forEach((q, idx) => {
        if (selectedAnswers[idx] === q.correctIndex) {
          correct += 1;
        }
      });
      setQuizFinished(true);
      onCompleteQuiz(correct * 25);
      onNotify(`Checkpoint completed! Score: ${correct} / ${QUIZ_QUESTIONS.length}`);
    }
  };

  const handleRestart = () => {
    setSelectedAnswers({});
    setCurrentIdx(0);
    setQuizFinished(false);
    setShowHint(false);
  };

  if (quizFinished) {
    let score = 0;
    QUIZ_QUESTIONS.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) score += 1;
    });

    return (
      <section className="page practice-page">
        <div className="quiz-summary-card">
          <div className="summary-icon">🎉</div>
          <p className="eyebrow purple">CHECKPOINT COMPLETE</p>
          <h1>Great observation precision!</h1>
          <p className="subtitle">
            You scored <strong>{score} out of {QUIZ_QUESTIONS.length}</strong> on the instrument readings checkpoint.
          </p>

          <div className="score-pills">
            <div className="score-pill">
              <span>ACCURACY</span>
              <strong>{Math.round((score / QUIZ_QUESTIONS.length) * 100)}%</strong>
            </div>
            <div className="score-pill">
              <span>XP REWARD</span>
              <strong>+{score * 25} XP</strong>
            </div>
            <div className="score-pill">
              <span>STATUS</span>
              <strong>Mastered</strong>
            </div>
          </div>

          <div className="quiz-summary-actions">
            <button className="primary-action" onClick={onOpenBench}>
              Conduct Virtual Practical →
            </button>
            <button className="secondary-action" onClick={handleRestart}>
              Retake Checkpoint
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="page practice-page">
      <div className="practice-head">
        <div>
          <button className="back-btn" onClick={() => window.history.back()}>
            ← Back to learning
          </button>
          <p className="eyebrow purple">CHECKPOINT #{question.number} · LEAST COUNT PRECISION</p>
          <h1>Read the instrument with care.</h1>
          <p className="subtitle">{question.subtitle}</p>
        </div>

        <div className="xp-card">
          <span className="xp-star">✦</span>
          <strong>+25 XP</strong>
          <p>for precision verification</p>
        </div>
      </div>

      <div className="lab-layout">
        {/* Main Question Card */}
        <section className="question-card">
          <div className="question-header">
            <div className="question-number">
              Question 0{question.number} <span>of 0{question.total}</span>
            </div>
            <div className="progress-bar-thin">
              <span style={{ width: `${((currentIdx + 1) / QUIZ_QUESTIONS.length) * 100}%` }} />
            </div>
          </div>

          <h2>{question.title}</h2>

          {/* Instrument Display Box */}
          <div className="instrument-box">
            <span className="instrument-tag">{question.instrumentType.toUpperCase()}</span>
            <strong className="instrument-digits">{question.displayValue}</strong>
            <p className="least-count-badge">{question.leastCount}</p>
          </div>

          {/* Options */}
          <div className="options-grid">
            {question.options.map((choice, index) => {
              const isSelected = selectedOption === index;
              return (
                <button
                  key={choice}
                  className={`option-btn ${isSelected ? "selected" : ""}`}
                  onClick={() => handleSelectOption(index)}
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
            disabled={!isAnswered}
            onClick={handleNext}
          >
            {currentIdx < QUIZ_QUESTIONS.length - 1 ? "Next question →" : "Finish Checkpoint →"}
          </button>
        </section>

        {/* Hint & Concept Card */}
        <aside className="hint-card">
          <div className="hint-icon">⌁</div>
          <p className="eyebrow">A LITTLE NUDGE</p>
          <h3>{question.hintTitle}</h3>
          <p>{question.hintDescription}</p>

          {showHint ? (
            <div className="explanation-reveal">
              <strong>Key Principle:</strong>
              <p>{question.explanation}</p>
            </div>
          ) : (
            <button className="hint-toggle-btn" onClick={() => setShowHint(true)}>
              Reveal conceptual explanation →
            </button>
          )}
        </aside>
      </div>
    </section>
  );
}
