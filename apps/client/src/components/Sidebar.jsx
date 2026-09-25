import { LabVRLogo } from "./LabVRLogo.jsx";

export function Sidebar({ currentView, onNavigate, user, onOpenAuth, onSignOut }) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "⌂" },
    { id: "bench", label: "Virtual Bench", icon: "⚡", badge: "LIVE" },
    { id: "practice", label: "Practice Lab", icon: "◫" },
    { id: "quests", label: "Quests & XP", icon: "✦" },
    { id: "notebook", label: "Lab Notebook", icon: "📓" },
  ];

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
    <aside className="sidebar">
      <a className="logo" href="#top" onClick={(e) => { e.preventDefault(); onNavigate("dashboard"); }}>
        <LabVRLogo size={36} />
      </a>

      <p className="workspace-label">MY LEARNING SPACE</p>

      <nav className="side-nav" aria-label="Learning navigation">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={currentView === item.id ? "active" : ""}
            onClick={() => onNavigate(item.id)}
          >
            <i>{item.icon}</i>
            <span>{item.label}</span>
            {item.badge && <span className="nav-pill-badge">{item.badge}</span>}
          </button>
        ))}
      </nav>

      <div className="sidebar-card">
        <div className="sidebar-card-header">
          <span className="little-star">✦</span>
          <span className="streak-badge-mini">🔥 {user ? user.streak : 0} days</span>
        </div>
        <strong>Keep your streak alive!</strong>
        <p>Complete a practical reading today.</p>
        <button onClick={() => onNavigate("bench")}>
          Open Virtual Bench →
        </button>
      </div>

      <div className="profile">
        {user ? (
          <>
            <div className="avatar">{getInitials(user.name)}</div>
            <div className="profile-details">
              <strong>{user.name}</strong>
              <span>{user.grade} · {user.board}</span>
            </div>
            <button
              className="sign-out-btn"
              title="Sign out"
              aria-label="Sign out"
              onClick={onSignOut}
            >
              ↪
            </button>
          </>
        ) : (
          <>
            <div className="avatar guest">?</div>
            <div className="profile-details">
              <strong>Guest Learner</strong>
              <span>Save your progress</span>
            </div>
            <button
              className="sign-in-link-btn"
              title="Sign in"
              aria-label="Sign in"
              onClick={() => onOpenAuth("sign-in")}
            >
              →
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
