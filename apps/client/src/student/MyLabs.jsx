import { useState } from "react";

function dueLabel(lab) {
  if (!lab.dueAt) return null;
  const due = new Date(lab.dueAt);
  const days = Math.ceil((due - new Date()) / 864e5);
  if (days < 0) return { text: `Closed ${Math.abs(days)}d ago`, tone: "late" };
  if (days === 0) return { text: "Due today", tone: "soon" };
  if (days <= 2) return { text: `Due in ${days}d`, tone: "soon" };
  return { text: `Due ${due.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`, tone: "ok" };
}

export function MyLabs({
  data,
  loading,
  error,
  activeLabId,
  onStart,
  onOpenQuiz,
  onSubmit,
  onJoinClass,
  onReload,
}) {
  const [code, setCode] = useState("");

  if (loading) return <div className="empty-state">Loading your labs…</div>;
  if (error) {
    return (
      <div className="empty-state error">
        ⚠ {error}
        <button className="text-action-btn" onClick={onReload}>
          Retry
        </button>
      </div>
    );
  }

  // Not enrolled anywhere yet — offer the join-code form.
  if (!data?.class) {
    return (
      <section className="page">
        <div className="welcome-row">
          <div>
            <p className="eyebrow">MY LABS</p>
            <h1>Join your class</h1>
            <p className="subtitle">
              Your teacher will give you a join code. Labs appear here as they unlock them.
            </p>
          </div>
        </div>

        <form
          className="panel join-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (code.trim()) onJoinClass(code.trim());
          }}
        >
          <label>
            Class join code
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. PHY10A"
              style={{ textTransform: "uppercase" }}
            />
          </label>
          <button className="primary-action">Join class</button>
        </form>
      </section>
    );
  }

  const labs = data.labs;
  const completed = labs.filter((l) => l.status === "SUBMITTED").length;

  return (
    <section className="page">
      <div className="welcome-row">
        <div>
          <p className="eyebrow">{data.class.name.toUpperCase()}</p>
          <h1>My labs</h1>
          <p className="subtitle">
            {completed} of {labs.length} submitted
            {data.lockedCount > 0 && ` · ${data.lockedCount} more unlock later in the syllabus`}
          </p>
        </div>
      </div>

      {labs.length === 0 && (
        <div className="empty-state">
          Your teacher hasn&apos;t unlocked any labs yet. Check back soon.
        </div>
      )}

      <div className="my-labs-grid">
        {labs.map((lab) => {
          const due = dueLabel(lab);
          const isActive = lab.id === activeLabId;
          const submitted = lab.status === "SUBMITTED";
          const quizDone = lab.quizScore !== null;
          const enoughReadings = lab.observationCount >= lab.requiredObservations;

          return (
            <div key={lab.id} className={`panel my-lab-card ${submitted ? "done" : ""} ${isActive ? "active" : ""}`}>
              <div className="my-lab-head">
                <span className={`subject-badge ${lab.subject}`}>{lab.subject.toUpperCase()}</span>
                <div className="my-lab-chips">
                  {due && <span className={`due-chip ${due.tone}`}>{due.text}</span>}
                  {submitted && <span className="status-chip open">SUBMITTED</span>}
                  {!submitted && lab.status === "IN_PROGRESS" && (
                    <span className="status-chip due">IN PROGRESS</span>
                  )}
                </div>
              </div>

              <h3>{lab.title}</h3>
              <p>{lab.description}</p>

              <div className="lab-meta">
                <span>{lab.difficulty}</span>
                <span>⏱ {lab.durationMinutes} min</span>
                <span>{lab.questionCount} quiz questions</span>
              </div>

              {submitted ? (
                <div className="my-lab-result">
                  <div className="result-score">
                    <strong>{lab.score}%</strong>
                    <span>your score</span>
                  </div>
                  <div className="result-detail">
                    <p>
                      Quiz {lab.quizScore}/{lab.quizTotal} · {lab.observationCount} readings logged
                    </p>
                    {lab.teacherRemark && <p className="teacher-remark">💬 {lab.teacherRemark}</p>}
                  </div>
                </div>
              ) : (
                <>
                  {/* Checklist makes the requirements for a good score explicit */}
                  <ul className="lab-checklist">
                    <li className={enoughReadings ? "done" : ""}>
                      {enoughReadings ? "✓" : "○"} Log {lab.requiredObservations} readings
                      <small>
                        {lab.observationCount}/{lab.requiredObservations}
                      </small>
                    </li>
                    <li className={quizDone ? "done" : ""}>
                      {quizDone ? "✓" : "○"} Complete the quiz
                      <small>{quizDone ? `${lab.quizScore}/${lab.quizTotal}` : "not taken"}</small>
                    </li>
                  </ul>

                  <div className="my-lab-actions">
                    <button className="primary-action" onClick={() => onStart(lab)}>
                      {lab.status === "IN_PROGRESS" ? "Resume bench" : "Start lab"} →
                    </button>
                    <button className="secondary-action" onClick={() => onOpenQuiz(lab)}>
                      {quizDone ? "Retake quiz" : "Take quiz"}
                    </button>
                    <button
                      className="submit-lab-btn"
                      disabled={lab.observationCount === 0}
                      title={
                        lab.observationCount === 0
                          ? "Log at least one reading first"
                          : "Submit for assessment"
                      }
                      onClick={() => onSubmit(lab)}
                    >
                      Submit for assessment
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
