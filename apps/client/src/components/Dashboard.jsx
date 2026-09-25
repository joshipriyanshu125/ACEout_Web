import { EXPERIMENTS } from "../services/storage.js";

export function Dashboard({
  user,
  quests,
  onOpenBench,
  onOpenPractice,
  onOpenQuests,
  onOpenNotebook,
}) {
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
          <p className="eyebrow light">YOUR NEXT PRACTICAL SESSION</p>
          <h2>Motion &amp; Measurement: Simple Pendulum</h2>
          <p>
            Adjust string length, change gravitational acceleration (Earth/Moon/Jupiter), release at varying angles, and calculate acceleration due to gravity (g).
          </p>
          <div className="tags-container">
            <span className="tag">PHYSICS</span>
            <span className="tag">CLASS 10</span>
            <span className="tag">18 MIN</span>
            <span className="tag ready">3D BENCH READY</span>
          </div>
          <button className="primary-action" onClick={() => onOpenBench("pendulum")}>
            Launch Virtual Bench <span>→</span>
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
            <p className="eyebrow">EXPLORE VIRTUAL BENCHES</p>
            <h3>Interactive Science Practicals</h3>
          </div>
          <button className="text-action-btn" onClick={onOpenPractice}>
            Take precision quiz →
          </button>
        </div>

        <div className="modules-grid">
          {EXPERIMENTS.map((exp) => (
            <div key={exp.id} className="module-card">
              <div className="module-header">
                <span className={`subject-badge ${exp.subject}`}>{exp.subject.toUpperCase()}</span>
                <span className="difficulty-badge">{exp.difficulty}</span>
              </div>
              <h4>{exp.title}</h4>
              <p>{exp.description}</p>
              <div className="module-footer">
                <span className="duration-tag">⏱ {exp.durationMinutes} min</span>
                <button
                  className="open-module-btn"
                  onClick={() => onOpenBench(exp.benchType)}
                >
                  Launch Bench <span>→</span>
                </button>
              </div>
            </div>
          ))}
        </div>
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
