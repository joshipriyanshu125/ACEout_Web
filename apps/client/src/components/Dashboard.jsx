export function Dashboard({
  user,
  quests,
  labs = [],
  className,
  onOpenBench,
  onOpenLabs,
  onOpenPractice,
  onOpenQuests,
  onOpenNotebook,
}) {
  // The next lab to work on: first one not yet submitted.
  const nextLab = labs.find((l) => l.status !== "SUBMITTED") || labs[0] || null;
  const submittedCount = labs.filter((l) => l.status === "SUBMITTED").length;
  const todayDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).toUpperCase();

  const daysOfWeek = ["M", "T", "W", "T", "F", "S", "S"];
  const currentDayIndex = (new Date().getDay() + 6) % 7; // Monday = 0

  return (
    <section className="page dashboard-page">
      {/* Welcome Header */}
      <div className="welcome-row">
        <div>
          <p className="eyebrow">{todayDate}</p>
          <h1>
            Good day, {(user?.name || "Learner").split(" ")[0]} <span>✦</span>
          </h1>
          <p className="subtitle">
            A small session today goes a long way. Ready to conduct a practical experiment in the virtual bench?
          </p>
        </div>

        <div className="streak">
          <span className="flame-emoji">🔥</span>
          <div>
            <strong>{user?.streak || 0} day streak</strong>
            <p>Your best is {user?.bestStreak || 0} days</p>
          </div>
        </div>
      </div>

      {/* Hero Focus Card */}
      <section className="focus-card">
        <div className="focus-copy">
          <p className="eyebrow light">
            {nextLab ? "YOUR NEXT PRACTICAL SESSION" : "NOTHING ASSIGNED YET"}
          </p>
          <h2>{nextLab ? nextLab.title : "Waiting on your teacher"}</h2>
          <p>
            {nextLab
              ? nextLab.description
              : "Your teacher unlocks labs as the syllabus moves forward. They'll show up here the moment one opens."}
          </p>
          <div className="tags-container">
            {nextLab ? (
              <>
                <span className="tag">{nextLab.subject.toUpperCase()}</span>
                <span className="tag">{nextLab.grade.toUpperCase()}</span>
                <span className="tag">{nextLab.durationMinutes} MIN</span>
                <span className="tag ready">{nextLab.difficulty.toUpperCase()}</span>
              </>
            ) : (
              <span className="tag">NO LABS UNLOCKED</span>
            )}
          </div>
          <button className="primary-action" onClick={onOpenLabs}>
            {nextLab ? "Open my labs" : "Check my labs"} <span>→</span>
          </button>
        </div>

        <div className="focus-art" aria-hidden="true">
          <div className="bench-label">LIVE SIMULATION</div>
          <div className="pendulum-animated">
            <span className="pivot-point" />
            <div className="pendulum-rod">
              <i className="pendulum-bob" />
            </div>
          </div>
          <div className="ruler-badge">0&nbsp;&nbsp;&nbsp;1&nbsp;&nbsp;&nbsp;2&nbsp;&nbsp;&nbsp;3&nbsp;&nbsp;&nbsp;4&nbsp;&nbsp;&nbsp;5 m</div>
          <div className="art-spark one">✦</div>
          <div className="art-spark two">✦</div>
        </div>
      </section>

      {/* Grid: Progress & Quests Preview */}
      <div className="content-grid">
        {/* Weekly Progress */}
        <section className="panel progress-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">THIS WEEK</p>
              <h3>Weekly momentum</h3>
            </div>
            <button onClick={onOpenNotebook}>View notebook ↗</button>
          </div>

          <div className="weekly">
            <div className="weekly-ring">
              <strong>
                {Math.round(((user?.sessionsThisWeek || 0) / 7) * 100)}
                <small>%</small>
              </strong>
              <span>weekly goal</span>
            </div>

            <div className="days">
              {daysOfWeek.map((day, idx) => {
                const isDone = idx < (user?.sessionsThisWeek || 0);
                const isToday = idx === currentDayIndex;
                return (
                  <div key={`${day}-${idx}`} className={`day-item ${isDone ? "done" : ""} ${isToday ? "today" : ""}`}>
                    <i>{isDone ? "✓" : isToday ? "•" : ""}</i>
                    <span>{day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="progress-note">
            <b>{Math.max(0, 7 - (user?.sessionsThisWeek || 0))} sessions</b> remaining to reach this week’s science milestone.
          </p>
        </section>

        {/* Quests Preview */}
        <section className="panel quest-preview">
          <div className="panel-head">
            <div>
              <p className="eyebrow">ACTIVE CHALLENGES</p>
              <h3>Daily quests</h3>
            </div>
            <button onClick={onOpenQuests}>See all quests →</button>
          </div>

          <div className="quests-summary-list">
            {(quests || []).slice(0, 2).map((quest) => (
              <div key={quest.id} className="quest-item-mini">
                <div className={`quest-dot ${quest.color}`}>✦</div>
                <div className="quest-info">
                  <div className="quest-title-row">
                    <strong>{quest.title}</strong>
                    <span className="quest-xp-badge">+{quest.xp} XP</span>
                  </div>
                  <div className="meter">
                    <span
                      className={quest.color}
                      style={{ width: `${Math.min(100, (quest.current / quest.target) * 100)}%` }}
                    />
                  </div>
                  <small>
                    {quest.current} / {quest.target} {quest.unit}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Virtual Lab Modules Selection */}
      <section className="lab-modules-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">
              {className ? `UNLOCKED IN ${className.toUpperCase()}` : "YOUR ASSIGNED LABS"}
            </p>
            <h3>
              Interactive Science Practicals
              {labs.length > 0 && ` · ${submittedCount}/${labs.length} done`}
            </h3>
          </div>
          <button className="text-action-btn" onClick={onOpenLabs}>
            See all my labs →
          </button>
        </div>

        {labs.length === 0 ? (
          <div className="empty-state">
            No labs unlocked yet. Your teacher will open them as the syllabus progresses.
          </div>
        ) : (
          <div className="modules-grid">
            {labs.map((lab) => (
              <div key={lab.id} className="module-card">
                <div className="module-header">
                  <span className={`subject-badge ${lab.subject}`}>
                    {lab.subject.toUpperCase()}
                  </span>
                  <span className="difficulty-badge">
                    {lab.status === "SUBMITTED" ? `✓ ${lab.score}%` : lab.difficulty}
                  </span>
                </div>
                <h4>{lab.title}</h4>
                <p>{lab.description}</p>
                <div className="module-footer">
                  <span className="duration-tag">⏱ {lab.durationMinutes} min</span>
                  <button className="open-module-btn" onClick={onOpenLabs}>
                    {lab.status === "SUBMITTED" ? "View result" : "Open lab"} <span>→</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quick Resume Strip */}
      <section className="resume" onClick={() => onOpenBench("sound")}>
        <div>
          <span className="resume-icon">◉</span>
          <div>
            <p>QUICK BENCH SESSION</p>
            <h3>Sound: Oscilloscope Wave Generator</h3>
            <span>Physics · Realtime Audio Synthesizer &amp; Standing Waves</span>
          </div>
        </div>
        <button>
          Launch Oscilloscope <span>→</span>
        </button>
      </section>
    </section>
  );
}
