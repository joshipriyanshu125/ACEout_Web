import { useState } from "react";
import { api } from "../api.js";
import { useApi, useApp } from "../app-context.js";
import { colorFor, downloadCSV, isNum, pctText, scoreColor, shortDate, slug, STATUS, subjectColor } from "../lib/format.js";
import { navigate, path } from "../route.js";
import { Avatar, Bar, Breadcrumb, Card, clickable, StatCard, StatusPill, Tabs, Tile } from "../ui/bits.jsx";
import { Button } from "../ui/Button.jsx";
import { Async, Empty } from "../ui/states.jsx";
import { autoGrid, C, fr, h2, headRow, sub } from "../ui/theme.js";

const COLS = "minmax(160px,1fr) 60px 130px 100px 90px 100px";

export default function LabReport({ labId, classId }) {
  const state = useApi(() => api.labReport(labId, classId), [labId, classId]);
  const title = state.data?.lab.title;
  return (
    <>
      <Breadcrumb items={[{ label: "Lab catalog", to: "/labs" }, { label: title || "Lab report" }]} />
      <Async state={state}>{(d) => <Report d={d} labId={labId} classId={classId} />}</Async>
    </>
  );
}

function Report({ d, labId, classId }) {
  const app = useApp();
  const [busy, setBusy] = useState(false);
  const lab = d.lab;
  const bg = subjectColor(lab.subject);
  const s = d.stats;
  const selected = classId ? d.sections.find((x) => x.id === classId) : null;
  const sectionId = (row) => d.sections.find((x) => x.grade === row.grade && x.section === row.section)?.id;

  const stats = [
    { label: "COMPLETED", value: `${s.completed}/${s.total}`, sub: `${s.total ? Math.round((s.completed / s.total) * 100) : 0}% of assigned`, color: C.green },
    { label: "AVG PRECISION", value: pctText(s.precision), sub: "across finished benches", color: C.blue },
    { label: "AVG POST-LAB QUIZ", value: pctText(s.quiz), sub: d.quiz ? `${d.quiz.questions} auto-graded questions` : "no post-lab quiz", color: C.purple },
    { label: "AVG TIME", value: isNum(s.avgMinutes) ? `${s.avgMinutes} min` : "—", sub: `target ${s.targetMinutes} min`, color: C.amber },
  ];

  function exportCSV() {
    downloadCSV(
      `${slug(lab.title)}${selected ? `-${selected.grade}${selected.section}` : ""}-report.csv`,
      ["Student", "Class", "Section", "Status", "Precision %", "Faults", "Post-quiz %", "Mark", "Time (min)", "Submitted"],
      d.rows.map((r) => [
        r.name,
        r.grade,
        r.section,
        STATUS[r.status]?.label || r.status,
        isNum(r.precision) ? Math.round(r.precision) : "",
        r.faults ?? "",
        isNum(r.quiz) ? Math.round(r.quiz) : "",
        r.score ?? "",
        isNum(r.timeSpentSeconds) ? Math.round(r.timeSpentSeconds / 60) : "",
        r.submittedAt ? new Date(r.submittedAt).toISOString().slice(0, 10) : "",
      ]),
    );
  }

  async function unassign() {
    if (!selected) return;
    const name = `Class ${selected.grade} · ${selected.section}`;
    if (!window.confirm(`Unassign “${lab.title}” from ${name}? Work already submitted is kept.`)) return;
    setBusy(true);
    try {
      await api.unassign(lab.id, selected.id);
      app.toast(`Unassigned “${lab.title}” from ${name}`);
      navigate(path("labs", labId), { replace: true });
      app.refresh();
    } catch (e) {
      app.toast(e.message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div style={headRow}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
          <Tile text={lab.abbr} bg={bg} size={60} radius={16} fontSize={18} />
          <div style={{ minWidth: 0 }}>
            <h1 className="h1" style={{ margin: 0, font: fr(600, 30, 1.1) }}>
              {lab.title}
            </h1>
            <div style={{ fontSize: 13, color: C.muted, fontWeight: 700, marginTop: 4 }}>
              {lab.subject} · Class {lab.grade} · {lab.unit} · {d.dueAt ? <span style={{ color: new Date(d.dueAt) < new Date() ? C.red : C.muted }}>due {shortDate(d.dueAt)}</span> : "no due date"}
            </div>
          </div>
        </div>
        {d.sections.length > 0 && (
          <Tabs
            value={classId || "all"}
            onChange={(v) => navigate(path("labs", labId, v === "all" ? null : v), { replace: true })}
            tabs={[{ value: "all", label: "All sections" }, ...d.sections.map((x) => ({ value: x.id, label: `Class ${x.grade} · ${x.section}` }))]}
          />
        )}
      </div>

      {!d.sections.length ? (
        <Empty
          title="Not assigned yet"
          text={`“${lab.title}” isn't assigned to any of your sections, so there's nothing to report.`}
          action={app.canEdit && <Button onClick={() => app.openAssign({ labId: lab.id, grade: lab.grade })}>Assign this lab</Button>}
        />
      ) : (
        <>
          <div style={autoGrid(150)}>
            {stats.map((x) => (
              <StatCard key={x.label} {...x} size={30} />
            ))}
          </div>

          <div className="split-grid">
            <div style={{ background: "#fff", border: `2px solid ${C.border}`, borderRadius: 18, overflowX: "auto" }}>
              <div style={{ display: "grid", minWidth: 640, gridTemplateColumns: COLS, gap: 12, padding: "12px 18px", background: C.page, fontSize: 11, fontWeight: 800, color: C.muted, letterSpacing: ".06em" }}>
                <div>STUDENT</div>
                <div>SEC</div>
                <div>STATUS</div>
                <div>PRECISION</div>
                <div>FAULTS</div>
                <div>POST-QUIZ</div>
              </div>
              {d.rows.map((r) => {
                const cid = sectionId(r);
                return (
                  <div
                    key={r.studentId + r.section}
                    {...clickable(() => navigate(cid ? path("classes", r.grade, cid, r.studentId) : path("students", r.studentId)))}
                    className="hov-row"
                    style={{ display: "grid", minWidth: 640, gridTemplateColumns: COLS, gap: 12, padding: "11px 18px", borderTop: `1px solid ${C.track}`, alignItems: "center", cursor: "pointer" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      <Avatar name={r.name} size={30} bg={colorFor(r.name)} />
                      <div style={{ fontWeight: 800, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 13, color: C.muted }}>{r.section}</div>
                    <div>
                      <StatusPill status={STATUS[r.status]} />
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 13 }}>{pctText(r.precision)}</div>
                    <div style={{ fontWeight: 800, fontSize: 13, color: isNum(r.faults) && r.faults >= 3 ? C.red : C.ink }}>{r.faults ?? "—"}</div>
                    <div style={{ fontWeight: 800, fontSize: 13, color: scoreColor(r.quiz) }}>{pctText(r.quiz)}</div>
                  </div>
                );
              })}
              {!d.rows.length && <div style={{ padding: "22px 18px", ...sub, fontSize: 13 }}>No students in this section yet.</div>}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
              <Card pad={18}>
                <div style={h2}>Where students slipped</div>
                {d.faultSpots.length ? (
                  <>
                    {d.faultSpots.map((f) => (
                      <div key={f.step} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13 }}>
                          <span style={{ fontWeight: 800 }}>{f.step}</span>
                          <span style={{ fontWeight: 800, color: C.red }}>{f.pct}%</span>
                        </div>
                        <Bar pct={f.pct} color={C.red} />
                      </div>
                    ))}
                    <div style={sub}>% of students who triggered the fault at this step</div>
                  </>
                ) : (
                  <div style={sub}>{s.completed ? "No faults recorded — clean benches all round." : "Nothing yet. Fault hot-spots appear once students finish the lab."}</div>
                )}
              </Card>

              {d.quiz && (
                <div style={{ background: C.ink, borderRadius: 18, padding: 18, color: "#fff", display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".08em", color: C.onDark }}>DEFAULT POST-LAB QUIZ</div>
                  <div style={{ font: fr(600, 18) }}>{d.quiz.questions} questions · auto-graded</div>
                  <div style={{ fontSize: 13, color: C.onDark, fontWeight: 700 }}>Shown to each student right after the bench is cleared. Report goes to the student too.</div>
                  <Button variant="light" size="sm" onClick={() => navigate(path("quizzes", d.quiz.id, "results"))} style={{ marginTop: 4, padding: 10 }}>
                    View quiz breakdown
                  </Button>
                </div>
              )}

              <Button variant="secondary" size="sm" onClick={exportCSV} disabled={!d.rows.length} style={{ padding: 11 }}>
                Export CSV
              </Button>

              {app.canEdit && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <Button variant="link" size="sm" onClick={() => app.openAssign({ labId: lab.id, grade: selected?.grade ?? lab.grade, classIds: selected ? [selected.id] : undefined })}>
                    Change due date / reassign
                  </Button>
                  {selected ? (
                    <Button variant="dangerLink" size="sm" busy={busy} onClick={unassign}>
                      Unassign from {selected.grade}
                      {selected.section}
                    </Button>
                  ) : (
                    <span style={{ ...sub, fontSize: 11 }}>Pick a section tab to unassign</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
