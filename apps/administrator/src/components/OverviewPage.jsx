import { useEffect, useState } from "react";
import { getAnalytics, getSubscription, getTeachers, getStudents } from "../services/api.js";

export function OverviewPage({ session, onNavigate }) {
  const instId = session?.admin?.institutionId || "inst-1";
  const [analytics, setAnalytics] = useState(null);
  const [sub, setSub] = useState(null);
  const [teacherCount, setTeacherCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getAnalytics(instId),
      getSubscription(instId),
      getTeachers(instId),
    ]).then(([a, s, t]) => {
      setAnalytics(a);
      setSub(s);
      setTeacherCount(t.teachers?.length || 0);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [instId]);

  if (loading) return <div className="loading-page"><div className="spinner" /><span>Loading overview…</span></div>;

  const s = analytics?.summary || {};
  const classes = analytics?.classSummary || [];

  const statCards = [
    { label: "Total Students", value: s.totalStudents || 0, sub: `${s.activeStudents || 0} active`, icon: "🎓", color: "linear-gradient(90deg,#4f8ef7,#7c5cfc)" },
    { label: "At Risk", value: s.atRiskStudents || 0, sub: "need attention", icon: "⚠️", color: "linear-gradient(90deg,#f97316,#ef4444)" },
    { label: "Teachers", value: teacherCount, sub: "across all classes", icon: "👩‍🏫", color: "linear-gradient(90deg,#22d3ee,#4f8ef7)" },
    { label: "Avg XP", value: s.avgXp || 0, sub: "per student", icon: "⭐", color: "linear-gradient(90deg,#f59e0b,#f97316)" },
    { label: "Lab Completion", value: `${s.avgLabCompletion || 0}%`, sub: "school-wide avg", icon: "🧪", color: "linear-gradient(90deg,#10b981,#22d3ee)" },
    { label: "Syllabus Covered", value: `${s.avgSyllabus || 0}%`, sub: "avg across sections", icon: "📚", color: "linear-gradient(90deg,#7c5cfc,#4f8ef7)" },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Good day, {session?.admin?.name?.split(" ")[0] || "Admin"} 👋</h1>
        <p className="page-subtitle">Here's your institution at a glance — {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</p>
      </div>

      {/* Stat grid */}
      <div className="stat-grid">
        {statCards.map(sc => (
          <div key={sc.label} className="stat-card" style={{ "--stat-color": sc.color }}>
            <span className="stat-icon">{sc.icon}</span>
            <div className="stat-label">{sc.label}</div>
            <div className="stat-value">{sc.value}</div>
            <div className="stat-sub">{sc.sub}</div>
          </div>
        ))}
      </div>

      {/* Subscription banner */}
      {sub && (
        <div className="card mb-16" style={{ marginBottom: 20, background: "linear-gradient(135deg, rgba(79,142,247,0.08) 0%, rgba(124,92,252,0.06) 100%)", borderColor: "rgba(79,142,247,0.25)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 13, color: "var(--txt-muted)", marginBottom: 4 }}>Current Plan</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="badge badge-plan">{sub.plan?.name}</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{sub.subscription?.seatsUsed} / {sub.subscription?.seatsTotal} seats used</span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "var(--txt-muted)" }}>Renews on</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{sub.subscription?.renewalDate}</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("subscription")}>View Billing →</button>
          </div>
          <div className="progress-bar-wrap mt-8" style={{ marginTop: 14 }}>
            <div
              className={`progress-bar-fill${sub.subscription?.seatsUsed / sub.subscription?.seatsTotal > 0.9 ? " danger" : ""}`}
              style={{ width: `${Math.round((sub.subscription?.seatsUsed / sub.subscription?.seatsTotal) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Class summary table */}
      <div className="card">
        <div className="card-title"><span className="card-title-icon">🏫</span> All Sections — Syllabus Progress</div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Class / Section</th>
                <th>Subject</th>
                <th>Teacher</th>
                <th>Students</th>
                <th>Avg XP</th>
                <th>Syllabus</th>
              </tr>
            </thead>
            <tbody>
              {classes.map(cls => (
                <tr key={cls.id}>
                  <td><strong>{cls.label}</strong></td>
                  <td><span className="badge badge-cbse">{cls.subject}</span></td>
                  <td style={{ color: cls.teacherName === "Unassigned" ? "var(--clr-danger)" : "var(--txt-primary)" }}>
                    {cls.teacherName === "Unassigned" ? "⚠ Unassigned" : cls.teacherName}
                  </td>
                  <td>{cls.studentCount}</td>
                  <td><span className="font-mono">{cls.avgXp}</span></td>
                  <td style={{ minWidth: 140 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div className="progress-bar-wrap" style={{ flex: 1 }}>
                        <div
                          className={`progress-bar-fill${cls.syllabusProgress < 60 ? " danger" : cls.syllabusProgress >= 80 ? " success" : ""}`}
                          style={{ width: `${cls.syllabusProgress}%` }}
                        />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, width: 32, textAlign: "right" }}>{cls.syllabusProgress}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              {classes.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--txt-muted)", padding: "28px 0" }}>No classes found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: 12, marginTop: 20 }}>
        {[
          { label: "Add Teacher", icon: "➕", page: "teachers", color: "var(--clr-accent)" },
          { label: "Import Students", icon: "📥", page: "students", color: "var(--clr-success)" },
          { label: "View Analytics", icon: "📊", page: "analytics", color: "var(--clr-accent-2)" },
          { label: "Edit Curriculum", icon: "📚", page: "curriculum", color: "var(--clr-accent-3)" },
        ].map(qa => (
          <button key={qa.page} className="card" style={{ border: `1px solid ${qa.color}33`, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 12 }}
            onClick={() => onNavigate(qa.page)}>
            <span style={{ fontSize: 24 }}>{qa.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: qa.color }}>{qa.label} →</span>
          </button>
        ))}
      </div>
    </div>
  );
}
