import { api } from "../api.js";
import { useApi, useApp, useMediaQuery } from "../app-context.js";
import { initials, num } from "../lib/format.js";
import { navigate } from "../route.js";
import { Bar } from "../ui/bits.jsx";
import { C, fr, nu, label, sub } from "../ui/theme.js";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "⌂", iconBg: C.blue, to: "/dashboard" },
  { id: "classes", label: "Classes", icon: "Cl", iconBg: C.green, to: "/classes" },
  { id: "labs", label: "Labs", icon: "μ", iconBg: C.amber, to: "/labs" },
  { id: "quizzes", label: "Quizzes", icon: "?", iconBg: C.purple, to: "/quizzes" },
];

function Brand({ small, role }) {
  const size = small ? 36 : 38;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: small ? 0 : "4px 8px 18px" }}>
      <div
        style={{ width: size, height: size, borderRadius: small ? 10 : 11, background: C.blue, color: "#fff", font: fr(700, small ? 16 : 17), display: "grid", placeItems: "center", boxShadow: `0 3px 0 ${C.blueD}`, flex: "none" }}
      >
        Ph
      </div>
      <div>
        <div style={{ font: fr(600, 18, 1), whiteSpace: "nowrap" }}>LabBench</div>
        {!small && <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginTop: 3 }}>{role.toUpperCase()}</div>}
      </div>
    </div>
  );
}

function UserAvatar({ name }) {
  return (
    <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.amber, color: "#fff", display: "grid", placeItems: "center", font: fr(700, 13), flex: "none" }}>
      {initials(name)}
    </div>
  );
}

function SignOut({ onClick, dark }) {
  return (
    <button className="btn" onClick={onClick} style={{ border: 0, background: "transparent", padding: 0, color: dark ? C.ink : C.blueD, font: nu(800, 12), cursor: "pointer" }}>
      Sign out
    </button>
  );
}

function WeekCard() {
  const dash = useApi(() => api.dashboard(), []);
  const week = dash.data?.week;
  return (
    <div style={{ background: C.page, borderRadius: 14, padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={label}>THIS WEEK</div>
      <div style={{ font: fr(600, 26, 1), color: C.green }}>
        {week ? num(week.labsRun) : "—"} <span style={{ font: nu(800, 12), color: C.muted }}>labs run</span>
      </div>
      <Bar pct={week?.donePct ?? 0} />
      <div style={sub}>{week ? `${week.donePct}% of assigned work done` : dash.error ? "Couldn't load" : "Loading…"}</div>
    </div>
  );
}

export default function Shell({ active, children }) {
  const app = useApp();
  const narrow = useMediaQuery("(max-width: 900px)");
  const name = app.user.name;

  const navButton = (n, top) => {
    const on = active === n.id;
    return (
      <button
        key={n.id}
        className="btn"
        aria-current={on ? "page" : undefined}
        onClick={() => navigate(n.to)}
        style={
          top
            ? { border: 0, background: on ? C.ink : "transparent", color: on ? "#fff" : C.ink, font: nu(800, 14), padding: "9px 14px", borderRadius: 10, cursor: "pointer", whiteSpace: "nowrap" }
            : {
                display: "flex",
                alignItems: "center",
                gap: 12,
                border: 0,
                textAlign: "left",
                background: on ? C.ink : "transparent",
                color: on ? "#fff" : C.ink,
                font: nu(800, 15),
                padding: "11px 12px",
                borderRadius: 12,
                cursor: "pointer",
                width: "100%",
              }
        }
      >
        {!top && (
          <span style={{ width: 26, height: 26, borderRadius: 8, background: n.iconBg, display: "grid", placeItems: "center", font: fr(700, 12), color: "#fff", flex: "none" }}>{n.icon}</span>
        )}
        {n.label}
      </button>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: C.page }}>
      {narrow && (
        <header
          className="topbar no-print"
          style={{ display: "flex", alignItems: "center", gap: 28, padding: "0 28px", height: 64, background: "#fff", borderBottom: `2px solid ${C.border}`, position: "sticky", top: 0, zIndex: 5 }}
        >
          <Brand small role={app.roleLabel} />
          <nav className="topnav" aria-label="Main">
            {NAV.map((n) => navButton(n, true))}
          </nav>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="hide-sm" style={{ fontSize: 13, color: C.muted, fontWeight: 700, textAlign: "right" }}>
              {app.school} · {app.roleLabel}
            </div>
            <div title={`${name} · ${app.roleLabel}`}>
              <UserAvatar name={name} />
            </div>
            <SignOut onClick={app.logout} />
          </div>
        </header>
      )}

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {!narrow && (
          <aside
            className="no-print"
            style={{ width: 232, flex: "none", background: "#fff", borderRight: `2px solid ${C.border}`, display: "flex", flexDirection: "column", padding: "20px 14px", gap: 6, position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}
          >
            <Brand role={app.roleLabel} />
            <nav aria-label="Main" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {NAV.map((n) => navButton(n, false))}
            </nav>
            <div style={{ flex: 1 }} />
            <WeekCard />
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 8px 0" }}>
              <UserAvatar name={name} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
                <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={app.school}>
                  {app.roleLabel} · {app.school}
                </div>
                <SignOut onClick={app.logout} />
              </div>
            </div>
          </aside>
        )}
        <main className="main">{children}</main>
      </div>
    </div>
  );
}
