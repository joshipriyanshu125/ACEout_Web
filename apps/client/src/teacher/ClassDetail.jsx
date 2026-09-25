import { useCallback, useEffect, useState } from "react";
import { teacher } from "../services/api.js";

const MEDALS = ["🥇", "🥈", "🥉"];

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDuration(seconds) {
  if (!seconds) return "0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h ? `${h}h ${m}m` : `${m}m`;
}

/** Default deadline when unlocking: one week out, which is the usual lab cycle. */
function defaultDueDate() {
  const d = new Date(Date.now() + 7 * 864e5);
  return d.toISOString().slice(0, 10);
}

export function ClassDetail({ classId, onOpenStudent, onBack, onNotify, onClassChanged }) {
  const [tab, setTab] = useState("labs");
  const [detail, setDetail] = useState(null);
  const [labsData, setLabsData] = useState(null);
  const [rankings, setRankings] = useState(null);
  const [rankingLab, setRankingLab] = useState(""); // "" = overall
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingLab, setPendingLab] = useState(null); // lab awaiting a due date
  const [dueDate, setDueDate] = useState(defaultDueDate());

  const loadLabs = useCallback(async () => {
    const [d, l] = await Promise.all([teacher.classDetail(classId), teacher.labs(classId)]);
    setDetail(d);
    setLabsData(l);
  }, [classId]);

  const loadRankings = useCallback(async () => {
    const r = await teacher.rankings(classId, rankingLab || undefined);
    setRankings(r);
  }, [classId, rankingLab]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        await loadLabs();
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadLabs]);

  useEffect(() => {
    if (tab !== "rankings") return;
    let cancelled = false;
    (async () => {
      try {
        const r = await teacher.rankings(classId, rankingLab || undefined);
        if (!cancelled) setRankings(r);
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, classId, rankingLab]);

  const unlock = async (lab, withDate) => {
    try {
      await teacher.unlockLab(classId, lab.id, withDate ? new Date(withDate).toISOString() : null);
      onNotify(`"${lab.title}" unlocked for ${detail.class.name}`);
      setPendingLab(null);
      await loadLabs();
      onClassChanged?.();
      if (tab === "rankings") await loadRankings();
    } catch (err) {
      onNotify(err.message);
    }
  };

  const lock = async (lab) => {
    try {
      await teacher.lockLab(classId, lab.id);
      onNotify(`"${lab.title}" locked — students can no longer open it`);
      await loadLabs();
      onClassChanged?.();
    } catch (err) {
      onNotify(err.message);
    }
  };

  if (loading) return <div className="empty-state">Loading class…</div>;
  if (error) return <div className="empty-state error">⚠ {error}</div>;
  if (!detail || !labsData) return null;

  const { class: klass, students } = detail;
  const unlockedCount = labsData.labs.filter((l) => l.isUnlocked).length;

  return (
    <section className="page">
      <button className="back-link" onClick={onBack}>
        ← All classes
      </button>

      <div className="welcome-row">
        <div>
          <p className="eyebrow">{klass.grade} · {klass.board}</p>
          <h1>{klass.name}</h1>
          <p className="subtitle">
            Join code <b className="inline-code">{klass.joinCode}</b> · {students.length} students ·{" "}
            {unlockedCount} of {labsData.labs.length} labs unlocked
          </p>
        </div>
      </div>

      <div className="tab-bar">
        <button className={tab === "labs" ? "active" : ""} onClick={() => setTab("labs")}>
          Labs &amp; unlocking
        </button>
        <button className={tab === "rankings" ? "active" : ""} onClick={() => setTab("rankings")}>
          Rankings &amp; assessment
        </button>
        <button className={tab === "students" ? "active" : ""} onClick={() => setTab("students")}>
          Students ({students.length})
        </button>
      </div>

      {/* ------------------------------------------------ labs & unlocking */}
      {tab === "labs" && (
        <div className="lab-unlock-list">
          {labsData.labs.map((lab) => (
            <div key={lab.id} className={`lab-unlock-row ${lab.isUnlocked ? "unlocked" : "locked"}`}>
              <div className="lab-order">{lab.orderIndex}</div>

              <div className="lab-main">
                <div className="lab-title-row">
                  <h4>{lab.title}</h4>
                  {lab.isUnlocked ? (
                    <span className="status-chip open">UNLOCKED</span>
                  ) : (
                    <span className="status-chip closed">LOCKED</span>
                  )}
                  {lab.isUnlocked && lab.isPastDue && (
                    <span className="status-chip due">PAST DUE — READY TO REVIEW</span>
                  )}
                </div>
                <p>{lab.description}</p>
                <div className="lab-meta">
                  <span>{lab.difficulty}</span>
                  <span>⏱ {lab.durationMinutes} min</span>
                  <span>{lab.questionCount} quiz questions</span>
                  <span>{lab.requiredObservations} readings required</span>
                  {lab.isUnlocked && <span>Unlocked {formatDate(lab.unlockedAt)}</span>}
                  {lab.isUnlocked && lab.dueAt && <span>Due {formatDate(lab.dueAt)}</span>}
                </div>

                {lab.isUnlocked && (
                  <div className="lab-progress">
                    <div className="meter">
                      <span
                        className="green"
                        style={{
                          width: `${
                            labsData.studentCount
                              ? (lab.submittedCount / labsData.studentCount) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <small>
                      <b>{lab.submittedCount}</b> of {labsData.studentCount} submitted ·{" "}
                      {lab.inProgressCount} in progress
                    </small>
                  </div>
                )}
              </div>

              <div className="lab-actions">
                {lab.isUnlocked ? (
                  <button className="lock-btn" onClick={() => lock(lab)}>
                    Lock
                  </button>
                ) : pendingLab === lab.id ? (
                  <div className="due-picker">
                    <label>
                      Due date
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                      />
                    </label>
                    <button className="unlock-btn" onClick={() => unlock(lab, dueDate)}>
                      Confirm unlock
                    </button>
                    <button className="text-action-btn" onClick={() => setPendingLab(null)}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    className="unlock-btn"
                    onClick={() => {
                      setPendingLab(lab.id);
                      setDueDate(defaultDueDate());
                    }}
                  >
                    🔓 Unlock
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ------------------------------------------------------- rankings */}
      {tab === "rankings" && (
        <div className="rankings-view">
          <div className="rankings-controls">
            <label>
              Assessment scope
              <select value={rankingLab} onChange={(e) => setRankingLab(e.target.value)}>
                <option value="">Overall (all unlocked labs)</option>
                {labsData.labs
                  .filter((l) => l.isUnlocked)
                  .map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title}
                    </option>
                  ))}
              </select>
            </label>
          </div>

          {!rankings ? (
            <div className="empty-state">Loading rankings…</div>
          ) : (
            <>
              <div className="ranking-summary">
                <div className="summary-stat">
                  <strong>{rankings.summary.classAverage}%</strong>
                  <span>Class average</span>
                </div>
                <div className="summary-stat">
                  <strong>
                    {rankings.summary.submittedCount}/{rankings.summary.studentCount}
                  </strong>
                  <span>Students with submissions</span>
                </div>
                <div className="summary-stat">
                  <strong>{rankings.summary.notStartedCount}</strong>
                  <span>Not started</span>
                </div>
                {rankings.scope.type === "lab" && (
                  <div className="summary-stat">
                    <strong>{formatDate(rankings.scope.dueAt)}</strong>
                    <span>Due date</span>
                  </div>
                )}
              </div>

              <div className="ranking-table-wrap">
                <table className="ranking-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Student</th>
                      <th>Score</th>
                      <th>Labs done</th>
                      <th>Quiz accuracy</th>
                      <th>Readings</th>
                      <th>Time</th>
                      <th>Last submission</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {rankings.rankings.map((row) => (
                      <tr
                        key={row.student.id}
                        className={row.completedLabs === 0 ? "inactive-row" : ""}
                        onClick={() => onOpenStudent(row.student.id)}
                      >
                        <td className="rank-cell">
                          {row.completedLabs > 0 ? MEDALS[row.rank - 1] || `#${row.rank}` : "—"}
                        </td>
                        <td>
                          <div className="student-cell">
                            <div className="mini-avatar">{row.student.name.charAt(0)}</div>
                            <div>
                              <strong>{row.student.name}</strong>
                              <small>{row.student.email}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="score-cell">
                            <b>{row.averageScore}%</b>
                            {row.hasOverride && <span className="override-dot" title="Teacher adjusted">✎</span>}
                          </div>
                          <div className="meter thin">
                            <span
                              className={
                                row.averageScore >= 75
                                  ? "green"
                                  : row.averageScore >= 50
                                    ? "gold"
                                    : "coral"
                              }
                              style={{ width: `${row.averageScore}%` }}
                            />
                          </div>
                        </td>
                        <td>
                          {row.completedLabs}/{row.assignedLabs}
                          {row.inProgressLabs > 0 && (
                            <small className="muted-inline"> (+{row.inProgressLabs} open)</small>
                          )}
                        </td>
                        <td>{row.quizTotal ? `${row.quizAccuracy}%` : "—"}</td>
                        <td>{row.observationCount}</td>
                        <td>{formatDuration(row.timeSpentSeconds)}</td>
                        <td>{formatDate(row.lastSubmission)}</td>
                        <td className="row-cta">View →</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ------------------------------------------------------- students */}
      {tab === "students" && (
        <div className="student-grid">
          {students.map((s) => (
            <button key={s.id} className="student-card" onClick={() => onOpenStudent(s.id)}>
              <div className="mini-avatar large">{s.name.charAt(0)}</div>
              <strong>{s.name}</strong>
              <small>{s.email}</small>
              <span className="student-card-meta">
                {s.xp} XP · {s.streak} day streak
              </span>
              <span className="class-card-cta">View report →</span>
            </button>
          ))}
          {students.length === 0 && (
            <div className="empty-state">
              No students yet. Share join code <b>{klass.joinCode}</b> with your class.
            </div>
          )}
        </div>
      )}
    </section>
  );
}
