export function AdminTopbar({ title, breadcrumb, plan }) {
  const now = new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  return (
    <header className="admin-topbar">
      <div className="topbar-left">
        <div className="topbar-title">{title}</div>
        <div className="topbar-breadcrumb">{breadcrumb} · {now}</div>
      </div>
      <div className="topbar-right">
        {plan && <span className="topbar-badge">{plan}</span>}
      </div>
    </header>
  );
}
