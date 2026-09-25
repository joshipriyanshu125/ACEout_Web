export function QuestsView({
  user,
  quests,
  onClaimQuest,
  onOpenBench,
  onOpenPractice,
}) {
  const completedCount = (quests || []).filter((q) => q.completed || q.claimed).length;

  return (
    <section className="page quests-page">
      {/* Hero Banner */}
      <div className="quests-hero">
        <p className="eyebrow light">SEASONAL SCIENCE CHALLENGE</p>
        <h1>Small quests.<br />Real momentum.</h1>
        <p>Complete practical tasks, record virtual observations, and build lasting STEM intuition.</p>

        <div className="challenge-bar-wrapper">
          <div className="challenge-bar">
            <span
              style={{
                width: `${Math.min(100, (completedCount / Math.max(1, quests?.length || 1)) * 100)}%`,
              }}
            />
          </div>
          <b className="challenge-count">
            {completedCount} / {quests?.length || 0} completed
          </b>
        </div>

        <div className="challenge-stats">
          <div className="stat-box">
            <strong>{user?.xp || 0}</strong>
            <span>Total XP earned</span>
          </div>
          <div className="stat-box">
            <strong>{user?.streak || 0} Days</strong>
            <span>Active Streak</span>
          </div>
          <div className="stat-box">
            <strong>Level {Math.floor((user?.xp || 0) / 100) + 1}</strong>
            <span>Mastery Rank</span>
          </div>
        </div>
      </div>

      {/* Quest Items List */}
      <div className="quests-content">
        <div className="page-intro">
          <div>
            <p className="eyebrow">TODAY &amp; THIS WEEK</p>
            <h2>Active Missions</h2>
          </div>
          <button className="primary-action" onClick={onOpenBench}>
            Open Virtual Bench <span>→</span>
          </button>
        </div>

        <div className="quest-list">
          {(quests || []).map((quest) => {
            const isFinished = quest.completed || quest.current >= quest.target;
            return (
              <div key={quest.id} className={`quest-item ${quest.claimed ? "claimed" : ""}`}>
                <div className={`quest-dot ${quest.color}`}>✦</div>
                <div className="quest-info">
                  <div className="quest-top-line">
                    <strong>{quest.title}</strong>
                    <span className="quest-category-badge">{quest.category.toUpperCase()}</span>
                  </div>
                  <p className="quest-desc">{quest.description}</p>
                  <div className="meter">
                    <span
                      className={quest.color}
                      style={{
                        width: `${Math.min(100, (quest.current / quest.target) * 100)}%`,
                      }}
                    />
                  </div>
                  <small>
                    {quest.current} / {quest.target} {quest.unit} · Reward: +{quest.xp} XP
                  </small>
                </div>

                <div className="quest-actions">
                  {quest.claimed ? (
                    <span className="claimed-badge">✓ Claimed</span>
                  ) : isFinished ? (
                    <button className="claim-btn" onClick={() => onClaimQuest(quest.id)}>
                      Claim +{quest.xp} XP
                    </button>
                  ) : quest.id === "quest-1" || quest.id === "quest-3" ? (
                    <button className="action-link-btn" onClick={onOpenPractice}>
                      Take Quiz →
                    </button>
                  ) : (
                    <button className="action-link-btn" onClick={onOpenBench}>
                      Open Lab →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
