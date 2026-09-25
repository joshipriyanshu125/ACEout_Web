const NAV = [
  { section: "Main", items: [
    { id: "overview",     icon: "🏠", label: "Overview" },
    { id: "analytics",   icon: "📊", label: "Analytics" },
  ]},
  { section: "People", items: [
    { id: "teachers",    icon: "👩‍🏫", label: "Teachers" },
    { id: "students",    icon: "🎓", label: "Students" },
  ]},
  { section: "Academics", items: [
    { id: "curriculum",  icon: "📚", label: "Curriculum" },
  ]},
  { section: "Settings", items: [
    { id: "institution", icon: "🏫", label: "Institution Setup" },
    { id: "subscription",icon: "💳", label: "Billing & Plans" },
  ]},
];

export function AdminSidebar({ currentView, onNavigate, admin, institution, onLogout }) {
  const initials = admin?.name?.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase() || "AD";

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">
          <div className="sidebar-logo-icon">🔬</div>
          <div>
            <div className="sidebar-logo-text">LabVR Admin</div>
            <div className="sidebar-logo-sub">Institution Portal</div>
          </div>
        </div>
        {institution && (
          <div className="sidebar-inst-name" title={institution.name}>
            🏫 {institution.name}
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {NAV.map(group => (
          <div key={group.section}>
            <div className="sidebar-section-label">{group.section}</div>
            {group.items.map(item => (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                className={`sidebar-nav-item${currentView === item.id ? " active" : ""}`}
                onClick={() => onNavigate(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-admin-info">
          <div className="admin-avatar">{initials}</div>
          <div className="admin-info-text">
            <div className="admin-info-name">{admin?.name || "Admin"}</div>
            <div className="admin-info-role">Administrator</div>
          </div>
        </div>
        <button id="btn-logout" className="btn-logout" onClick={onLogout}>Sign Out</button>
      </div>
    </aside>
  );
}
