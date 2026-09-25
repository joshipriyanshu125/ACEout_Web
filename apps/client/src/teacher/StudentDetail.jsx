import { useCallback, useEffect, useState } from "react";
import { teacher } from "../services/api.js";

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDuration(seconds) {
  if (!seconds) return "0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h ? `${h}h ${m}m` : `${m}m`;
}

function scoreClass(score) {
  if (score >= 75) return "green";
  if (score >= 50) return "gold";
  return "coral";
}

/** Inline grade-override editor for one attempt. */
function GradeEditor({ attempt, onSaved, onNotify }) {
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState(attempt.overrideScore ?? "");
  const [remark, setRemark] = useState(attempt.teacherRemark ?? "");
  const [busy, setBusy] = useState(false);

  const save = async (clear = false) => {
    setBusy(true);
    try {
      await teacher.grade(attempt.id, clear ? null : score, remark);
      onNotify(clear ? "Override removed — auto-score restored" : "Grade updated");
      setOpen(false);
      await onSaved();
    } catch (err) {
      onNotify(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button className="text-action-btn" onClick={() => setOpen(true)}>
        {attempt.overrideScore !== null ? "Edit override ✎" : "Override score ✎"}
      </button>
    );
  }

  return (
    <div className="grade-editor">
      <label>
        Override score (0–100)
        <input
          type="number"
          min="0"
          max="100"
          step="0.5"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          placeholder={String(attempt.autoScore ?? "")}
        />
      </label>
      <label>
        Remark to the student
        <textarea
          rows={2}
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder="Good technique, but check your zero-error correction."
        />
      </label>
      <div className="grade-editor-actions">
        <button className="unlock-btn" disabled={busy} onClick={() => save(false)}>
          Save
        </button>
        {attempt.overrideScore !== null && (
          <button className="text-action-btn" disabled={busy} onClick={() => save(true)}>
            Remove override
          </button>
        )}
        <button className="text-action-btn" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export function StudentDetail({ classId, studentId, onBack, onNotify }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    const d = await teacher.student(classId, studentId);
    setData(d);
  }, [classId, studentId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        await load();
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  if (loading) return <div className="empty-state">Loading student report…</div>;
  if (error) return <div className="empty-state error">⚠ {error}</div>;
  if (!data) return null;

  const { student, summary, labs } = data;

  return (
    <section className="page">
      <button className="back-link" onClick={onBack}>
        ← Back to {data.class.name}
      </button>

      <div className="student-header">
        <div className="mini-avatar xl">{student.name.charAt(0)}</div>
        <div>
          <p className="eyebrow">STUDENT REPORT</p>
          <h1>{student.name}</h1>
          <p className="subtitle">
            {student.email} · {student.grade} · {student.xp} XP · {student.streak} day streak
          </p>
        </div>
      </div>

      <div className="ranking-summary">
        <div className="summary-stat">
          <strong className={scoreClass(summary.averageScore)}>{summary.averageScore}%</strong>
          <span>Average score</span>
        </div>
        <div className="summary-stat">
          <strong>
            {summary.completedLabs}/{summary.assignedLabs}
          </strong>
          <span>Labs submitted</span>
        </div>
        <div className="summary-stat">
          <strong>{summary.totalObservations}</strong>
          <span>Readings logged</span>
        </div>
        <div className="summary-stat">
          <strong>{formatDuration(summary.totalTimeSeconds)}</strong>
          <span>Time on bench</span>
        </div>
      </div>

      <div className="student-labs">
        {labs.map((entry) => {
          const { lab, attempt, dueAt, quizReview } = entry;
          const isOpen = expanded === lab.id;

          return (
            <div key={lab.id} className="panel student-lab-card">
              <div className="student-lab-head">
                <div>
                  <h3>{lab.title}</h3>
                  <div className="lab-meta">
                    <span>{lab.difficulty}</span>
                    <span>Due {dueAt ? formatDateTime(dueAt) : "—"}</span>
                    {attempt?.submittedAt && (
                      <span>Submitted {formatDateTime(attempt.submittedAt)}</span>
                    )}
                    {attempt && <span>{formatDuration(attempt.timeSpentSeconds)} on bench</span>}
                  </div>
                </div>

                <div className="student-lab-score">
                  {!attempt && <span className="status-chip closed">NOT STARTED</span>}
                  {attempt?.status === "IN_PROGRESS" && (
                    <span className="status-chip due">IN PROGRESS</span>
                  )}
                  {attempt?.status === "SUBMITTED" && (
                    <>
                      <strong className={scoreClass(attempt.finalScore)}>
                        {attempt.finalScore}%
                      </strong>
                      {attempt.overrideScore !== null && (
                        <small className="override-note">
                          adjusted from {attempt.autoScore}%
                        </small>
                      )}
                    </>
                  )}
                </div>
              </div>

              {attempt && (
                <>
                  {/* Score breakdown — shows exactly how the auto-score was reached */}
                  {attempt.breakdown && (
                    <div className="breakdown-row">
                      <div className="breakdown-item">
                        <span>Quiz</span>
                        <b>
                          {attempt.breakdown.quizPoints}/50
                        </b>
                        <small>
                          {attempt.breakdown.quizCorrect}/{attempt.breakdown.quizTotal} correct
                        </small>
                      </div>
                      <div className="breakdown-item">
                        <span>Observations</span>
                        <b>{attempt.breakdown.observationPoints}/30</b>
                        <small>
                          {attempt.breakdown.observationCount}/
                          {attempt.breakdown.requiredObservations} logged
                        </small>
                      </div>
                      <div className="breakdown-item">
                        <span>Completion</span>
                        <b>{attempt.breakdown.completionPoints}/20</b>
                        <small>{attempt.status === "SUBMITTED" ? "submitted" : "not submitted"}</small>
                      </div>
                      {attempt.breakdown.isLate && (
                        <div className="breakdown-item penalty">
                          <span>Late penalty</span>
                          <b>−{attempt.breakdown.latePenalty}</b>
                          <small>submitted after due date</small>
                        </div>
                      )}
                    </div>
                  )}

                  {attempt.teacherRemark && (
                    <p className="teacher-remark">💬 {attempt.teacherRemark}</p>
                  )}

                  <div className="student-lab-actions">
                    <button
                      className="text-action-btn"
                      onClick={() => setExpanded(isOpen ? null : lab.id)}
                    >
                      {isOpen ? "Hide work ▲" : "View readings & quiz answers ▼"}
                    </button>
                    <GradeEditor attempt={attempt} onSaved={load} onNotify={onNotify} />
                  </div>

                  {isOpen && (
                    <div className="student-work">
                      <h4>Observations ({attempt.observations.length})</h4>
                      {attempt.observations.length === 0 ? (
                        <p className="muted-inline">No readings logged.</p>
                      ) : (
                        <div className="observations-list">
                          {attempt.observations.map((obs, i) => (
                            <div key={obs.id} className="observation-entry">
                              <div className="obs-head">
                                <b>Reading {i + 1}</b>
                                <small>{formatDateTime(obs.createdAt)}</small>
                              </div>
                              <table className="readings-table">
                                <tbody>
                                  {Object.entries(obs.readings || {}).map(([k, v]) => (
                                    <tr key={k}>
                                      <th>{k}</th>
                                      <td>{String(v)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              {obs.notes && <p className="obs-notes">{obs.notes}</p>}
                            </div>
                          ))}
                        </div>
                      )}

                      <h4>Quiz answers</h4>
                      {quizReview.length === 0 ? (
                        <p className="muted-inline">Quiz not attempted.</p>
                      ) : (
                        <ol className="quiz-review">
                          {quizReview.map((q) => (
                            <li
                              key={q.questionId}
                              className={
                                !q.answered ? "unanswered" : q.isCorrect ? "correct" : "wrong"
                              }
                            >
                              <p className="quiz-q">{q.title}</p>
                              {q.answered ? (
                                <p className="quiz-a">
                                  {q.isCorrect ? "✓" : "✕"} Chose:{" "}
                                  <b>{q.options[q.selectedIndex]}</b>
                                  {!q.isCorrect && (
                                    <>
                                      {" "}· Correct: <b>{q.options[q.correctIndex]}</b>
                                    </>
                                  )}
                                </p>
                              ) : (
                                <p className="quiz-a">Not answered</p>
                              )}
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}

        {labs.length === 0 && (
          <div className="empty-state">No labs unlocked for this class yet.</div>
        )}
      </div>
    </section>
  );
}
