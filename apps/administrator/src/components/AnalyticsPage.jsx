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
          { label: "Total Students", value: s.totalStudents, icon: "🎓", color: "linear-gradient(90deg,#4f8ef7,#7c5cfc)" },
          { label: "Active Students", value: s.activeStudents, icon: "✅", color: "linear-gradient(90deg,#10b981,#22d3ee)" },
          { label: "At-Risk Students", value: s.atRiskStudents, icon: "⚠️", color: "linear-gradient(90deg,#f97316,#ef4444)" },
          { label: "Avg XP / Student", value: s.avgXp, icon: "⭐", color: "linear-gradient(90deg,#f59e0b,#f97316)" },
          { label: "Avg Lab Completion", value: `${s.avgLabCompletion}%`, icon: "🧪", color: "linear-gradient(90deg,#22d3ee,#4f8ef7)" },
          { label: "Avg Syllabus Coverage", value: `${s.avgSyllabus}%`, icon: "📚", color: "linear-gradient(90deg,#7c5cfc,#4f8ef7)" },
        ].map(c => (
          <div key={c.label} className="stat-card" style={{ "--stat-color": c.color }}>
            <span className="stat-icon">{c.icon}</span>
            <div className="stat-label">{c.label}</div>
            <div className="stat-value">{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Sections behind */}
        <div className="card">
          <div className="card-title"><span className="card-title-icon">🔴</span> Sections Behind (&lt;60%)</div>
          {behind.length === 0 ? (
            <div className="text-muted" style={{ fontSize: 13, padding: "12px 0" }}>All sections are on track! 🎉</div>
          ) : behind.map(c => (
            <div key={c.id} className="lab-toggle-row" style={{ borderColor: "rgba(239,68,68,0.2)" }}>
              <div className="lab-toggle-info">
                <div className="lab-toggle-title">{c.label} — {c.subject}</div>
                <div className="lab-toggle-meta">{c.teacherName} · {c.studentCount} students</div>
              </div>
              <span style={{ fontWeight: 700, color: "var(--clr-danger)", fontSize: 14 }}>{c.syllabusProgress}%</span>
            </div>
          ))}
        </div>
        {/* Sections ahead */}
        <div className="card">
          <div className="card-title"><span className="card-title-icon">🟢</span> Sections Ahead (≥80%)</div>
          {ahead.length === 0 ? (
            <div className="text-muted" style={{ fontSize: 13, padding: "12px 0" }}>No sections above 80% yet.</div>
          ) : ahead.map(c => (
            <div key={c.id} className="lab-toggle-row" style={{ borderColor: "rgba(16,185,129,0.2)" }}>
              <div className="lab-toggle-info">
                <div className="lab-toggle-title">{c.label} — {c.subject}</div>
                <div className="lab-toggle-meta">{c.teacherName} · {c.studentCount} students</div>
              </div>
              <span style={{ fontWeight: 700, color: "var(--clr-success)", fontSize: 14 }}>{c.syllabusProgress}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Syllabus progress bar chart */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-title"><span className="card-title-icon">📊</span> Syllabus Coverage by Section</div>
        <div className="chart-bar-wrap">
          {sorted.map(c => (
            <div key={c.id} className="chart-bar-row">
              <div className="chart-bar-label" title={`${c.label} (${c.subject})`}>{c.label}</div>
              <div className="chart-bar-bg"><div className="chart-bar-fill" style={{ width: `${c.syllabusProgress}%`, background: c.syllabusProgress < 60 ? "linear-gradient(90deg,#ef4444,#f97316)" : c.syllabusProgress >= 80 ? "linear-gradient(90deg,#10b981,#34d399)" : "var(--grad-brand)" }} /></div>
              <div className="chart-bar-val">{c.syllabusProgress}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Teacher performance summary */}
      <div className="card">
        <div className="card-title"><span className="card-title-icon">👩‍🏫</span> Teacher Performance Summary</div>
        <div className="table-container">
          <table>
            <thead><tr><th>Teacher</th><th>Subject</th><th>Classes</th><th>Total Students</th><th>Avg Syllabus</th></tr></thead>
            <tbody>
              {teachers.filter(t => t.status === "active").map(t => {
                const tClasses = classes.filter(c => c.teacherName === t.name);
                const totalStu = tClasses.reduce((a, c) => a + c.studentCount, 0);
                const avgSyl = tClasses.length ? Math.round(tClasses.reduce((a, c) => a + c.syllabusProgress, 0) / tClasses.length) : 0;
                return (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 600 }}>{t.name}</td>
                    <td><span className="badge badge-cbse">{t.subject}</span></td>
                    <td>{tClasses.map(c => c.label).join(", ") || "—"}</td>
                    <td>{totalStu}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div className="progress-bar-wrap" style={{ width: 80 }}>
                          <div className={`progress-bar-fill${avgSyl < 60 ? " danger" : avgSyl >= 80 ? " success" : ""}`} style={{ width: `${avgSyl}%` }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{avgSyl}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
