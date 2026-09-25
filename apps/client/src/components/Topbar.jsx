import { LabVRLogo } from "./LabVRLogo.jsx";

export function Topbar({ currentView, onNavigate, user, onOpenAuth, onNotify }) {
  const getViewTitle = () => {
    switch (currentView) {
      case "dashboard":
        return "Home Dashboard";
      case "bench":
        return "Virtual Bench · Interactive Lab";
      case "practice":
        return "Practice Lab · Checkpoints";
      case "quests":
        return "Quests & Challenges";
      case "notebook":
        return "Digital Observation Notebook";
      default:
        return "Learning Space";
    }
  };

  const getInitials = (name) => {
    return (name || "")
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "LV";
  };

  return (
    <header className="topbar">
      <button className="mobile-logo" onClick={() => onNavigate("dashboard")}>
        <LabVRLogo size={28} />
      </button>

      <div className="crumb">
        <span>Learning space</span> <b>/</b> <strong>{getViewTitle()}</strong>
      </div>

      <div className="top-actions">
        {user && (
          <div className="xp-pill" onClick={() => onNavigate("quests")}>
            <span className="xp-icon">✦</span>
            <strong>{user.xp}</strong>
            <small>XP</small>
          </div>
        )}

        <button
          className="help-btn"
          title="Lab Guide & Keyboard Shortcuts"
          onClick={() => onNotify("Lab Tip: Press Space in Virtual Bench to Start/Pause timer.")}
        >
          ?
        </button>

        {user ? (
          <>
            <button
              className="bell-btn"
              title="Notifications"
              onClick={() => onNotify("You're on track for your 7-day science streak!")}
            >
              ♧<b className="bell-dot" />
            </button>
            <div className="mini-avatar" title={user.name}>
              {getInitials(user.name)}
            </div>
          </>
        ) : (
          <div className="guest-auth-actions">
            <button className="auth-link" onClick={() => onOpenAuth("sign-in")}>
              Sign in
            </button>
            <button className="auth-cta" onClick={() => onOpenAuth("sign-up")}>
              Create account
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
