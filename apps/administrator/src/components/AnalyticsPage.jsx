import { useEffect, useState } from "react";
import { getAnalytics, getTeachers } from "../services/api.js";

export function AnalyticsPage({ session }) {
  const instId = session?.admin?.institutionId || "inst-1";
  const [analytics, setAnalytics] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAnalytics(instId), getTeachers(instId)])
      .then(([a, t]) => { setAnalytics(a); setTeachers(t.teachers || []); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [instId]);

  if (loading) return <div className="loading-page"><div className="spinner" /><span>Loading analytics…</span></div>;

  const s = analytics?.summary || {};
  const classes = analytics?.classSummary || [];
  const sorted = [...classes].sort((a, b) => b.syllabusProgress - a.syllabusProgress);
  const behind = classes.filter(c => c.syllabusProgress < 60);
  const ahead = classes.filter(c => c.syllabusProgress >= 80);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Institution-Wide Analytics</h1>
        <p className="page-subtitle">Performance across all classes and teachers — identify which sections are ahead or behind.</p>
      </div>

      {/* KPI cards */}
      <div className="stat-grid">
        {[
          { label: "Total Students", value: s.totalStudents || 0, sub: `${s.activeStudents || 0} active on LabVR`, icon: "🎓", color: "linear-gradient(90deg,#4f8ef7,#7c5cfc)" },
          { label: "Active Students", value: s.activeStudents || 0, sub: "engaged in practicals", icon: "✅", color: "linear-gradient(90deg,#10b981,#22d3ee)" },
          { label: "At-Risk Students", value: s.atRiskStudents || 0, sub: "requires intervention", icon: "⚠️", color: "linear-gradient(90deg,#f97316,#ef4444)" },
          { label: "Avg XP / Student", value: s.avgXp || 0, sub: "gamified lab score", icon: "⭐", color: "linear-gradient(90deg,#f59e0b,#f97316)" },
          { label: "Avg Lab Completion", value: `${s.avgLabCompletion || 0}%`, sub: "assigned experiment rate", icon: "🧪", color: "linear-gradient(90deg,#22d3ee,#4f8ef7)" },
          { label: "Avg Syllabus Coverage", value: `${s.avgSyllabus || 0}%`, sub: "curriculum completion", icon: "📚", color: "linear-gradient(90deg,#7c5cfc,#4f8ef7)" },
        ].map(c => (
          <div key={c.label} className="stat-card" style={{ "--stat-color": c.color }}>
            <span className="stat-icon">{c.icon}</span>
            <div className="stat-label">{c.label}</div>
            <div className="stat-value">{c.value}</div>
            <div className="stat-sub">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Sections Behind / Ahead Breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, marginBottom: 24 }}>
        {/* Sections behind */}
        <div className="card" style={{ borderColor: "rgba(244, 63, 94, 0.25)" }}>
          <div className="card-title" style={{ color: "#fb7185" }}>
            <span className="card-title-icon">⚠️</span> Sections Behind Schedule (&lt;60%)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {behind.length === 0 ? (
              <div style={{ fontSize: 13.5, color: "#34d399", padding: "16px", background: "rgba(16, 185, 129, 0.08)", borderRadius: "10px", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                🎉 Great job! All sections are on track and above 60% coverage.
              </div>
            ) : behind.map(c => (
              <div key={c.id} className="lab-toggle-row" style={{ borderColor: "rgba(244, 63, 94, 0.25)", background: "rgba(244, 63, 94, 0.05)" }}>
                <div className="lab-toggle-info">
                  <div className="lab-toggle-title">
                    <span>{c.label}</span>
                    <span className="badge badge-danger" style={{ fontSize: 10.5 }}>{c.subject}</span>
                  </div>
                  <div className="lab-toggle-meta">
                    <span>Teacher: <strong style={{ color: "var(--ink-primary)" }}>{c.teacherName}</strong></span>
                    <span>•</span>
                    <span>{c.studentCount} students</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800, color: "#fb7185", fontSize: 16 }}>{c.syllabusProgress}%</div>
                  <div style={{ fontSize: 10.5, color: "var(--ink-muted)", fontWeight: 600 }}>Covered</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sections ahead */}
        <div className="card" style={{ borderColor: "rgba(16, 185, 129, 0.25)" }}>
          <div className="card-title" style={{ color: "#34d399" }}>
            <span className="card-title-icon">🚀</span> High Performing Sections (≥80%)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {ahead.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--ink-muted)", padding: "16px", background: "var(--canvas-subtle)", borderRadius: "10px" }}>
                No sections have surpassed 80% coverage yet this term.
              </div>
            ) : ahead.map(c => (
              <div key={c.id} className="lab-toggle-row" style={{ borderColor: "rgba(16, 185, 129, 0.25)", background: "rgba(16, 185, 129, 0.05)" }}>
                <div className="lab-toggle-info">
                  <div className="lab-toggle-title">
                    <span>{c.label}</span>
                    <span className="badge badge-active" style={{ fontSize: 10.5 }}>{c.subject}</span>
                  </div>
                  <div className="lab-toggle-meta">
                    <span>Teacher: <strong style={{ color: "var(--ink-primary)" }}>{c.teacherName}</strong></span>
                    <span>•</span>
                    <span>{c.studentCount} students</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800, color: "#34d399", fontSize: 16 }}>{c.syllabusProgress}%</div>
                  <div style={{ fontSize: 10.5, color: "var(--ink-muted)", fontWeight: 600 }}>Covered</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Syllabus progress bar chart */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title"><span className="card-title-icon">📊</span> Syllabus Coverage by Section</div>
        <div className="chart-bar-wrap">
          {sorted.map(c => {
            const isBehind = c.syllabusProgress < 60;
            const isAhead = c.syllabusProgress >= 80;
            const barColor = isBehind
              ? "linear-gradient(90deg, #f43f5e 0%, #fb7185 100%)"
              : isAhead
              ? "linear-gradient(90deg, #10b981 0%, #34d399 100%)"
              : "linear-gradient(90deg, #06b6d4 0%, #3b82f6 100%)";

            return (
              <div key={c.id} className="chart-bar-row">
                <div className="chart-bar-label" title={`${c.label} (${c.subject})`}>
                  {c.label} <span style={{ fontSize: 11, color: "var(--ink-muted)", fontWeight: 500 }}>({c.subject})</span>
                </div>
                <div className="chart-bar-bg">
                  <div className="chart-bar-fill" style={{ width: `${c.syllabusProgress}%`, background: barColor }} />
                </div>
                <div className="chart-bar-val" style={{ color: isBehind ? "#fb7185" : isAhead ? "#34d399" : "var(--ink-primary)" }}>
                  {c.syllabusProgress}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Teacher performance summary */}
      <div className="card">
        <div className="card-title"><span className="card-title-icon">👩‍🏫</span> Faculty & Teacher Performance Summary</div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Subject</th>
                <th>Assigned Classes</th>
                <th>Total Students</th>
                <th>Average Syllabus Coverage</th>
              </tr>
            </thead>
            <tbody>
              {teachers.filter(t => (t.status || "").toLowerCase() === "active").map(t => {
                const tClasses = classes.filter(c => c.teacherName === t.name);
                const totalStu = tClasses.reduce((a, c) => a + (c.studentCount || 0), 0);
                const avgSyl = tClasses.length ? Math.round(tClasses.reduce((a, c) => a + c.syllabusProgress, 0) / tClasses.length) : 0;
                return (
                  <tr key={t.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="admin-avatar" style={{ width: 28, height: 28, minWidth: 28, fontSize: 10 }}>
                          {t.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </div>
                        <strong style={{ color: "var(--ink-primary)" }}>{t.name}</strong>
                      </div>
                    </td>
                    <td><span className="badge badge-cbse">{t.subject}</span></td>
                    <td>{tClasses.map(c => c.label).join(", ") || "—"}</td>
                    <td><span className="font-mono">{totalStu}</span></td>
                    <td style={{ minWidth: 160 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="progress-bar-wrap" style={{ flex: 1, maxWidth: 120 }}>
                          <div
                            className={`progress-bar-fill${avgSyl < 60 ? " danger" : avgSyl >= 80 ? " success" : ""}`}
                            style={{ width: `${avgSyl}%` }}
                          />
                        </div>
                        <span style={{ fontSize: 12.5, fontWeight: 700, width: 36, textAlign: "right" }}>{avgSyl}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {teachers.filter(t => (t.status || "").toLowerCase() === "active").length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--ink-muted)", padding: "28px 0" }}>No active faculty records found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
