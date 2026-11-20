import { useState } from "react";
import { api } from "../api.js";
import { useApi, useApp } from "../app-context.js";
import { colorFor, dash, dueInfo, num, pctText, relativeDay, scoreColor, subjectColor } from "../lib/format.js";
import { navigate, path } from "../route.js";
import { Avatar, Bar, Breadcrumb, Card, clickable, Tile } from "../ui/bits.jsx";
import { Button } from "../ui/Button.jsx";
import { Async, Empty } from "../ui/states.jsx";
import { autoGrid, C, fieldStyle, fr, h1, h2, headRow, nu, sub } from "../ui/theme.js";

const SECTION_COLORS = [C.blue, C.green, C.amber, C.red, C.purple, C.teal];

export default function Classes({ grade, classId }) {
  if (grade && classId) return <SectionView grade={grade} classId={classId} />;
  if (grade) return <GradeView grade={grade} />;
  return <ClassGrid />;
}

function ClassGrid() {
  const state = useApi(() => api.classes(), []);
  return (
    <>
      <Breadcrumb items={[{ label: "Classes" }]} />
      <h1 className="h1" style={h1}>
        Classes
      </h1>
      <Async state={state}>
        {(d) =>
          d.grades.length ? (
            <div style={autoGrid(230, 14, "auto-fill")}>
              {d.grades.map((g) => (
                <div
                  key={g.grade}
                  {...clickable(() => navigate(path("classes", g.grade)))}
                  className="hov-border"
                  style={{ background: "#fff", border: `2px solid ${C.border}`, borderBottomWidth: 5, borderRadius: 18, padding: 18, cursor: "pointer", display: "flex", flexDirection: "column", gap: 12 }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <div style={{ font: fr(600, 24) }}>{g.name}</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: C.muted }}>{g.students} students</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {g.sections.map((s) => (
                      <span key={s.id} title={s.teacher ? `Section ${s.section} · ${s.teacher}` : undefined} style={{ flex: 1, textAlign: "center", font: fr(700, 13), padding: "6px 0", borderRadius: 8, background: C.page, color: C.ink }}>
                        {s.section}
                      </span>
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: C.muted }}>
                    <span>
                      {g.activeLabs} active {g.activeLabs === 1 ? "lab" : "labs"}
                    </span>
                    <span style={{ color: C.green, fontWeight: 800 }}>{g.donePct}% done</span>
                  </div>
                  <Bar pct={g.donePct} />
                </div>
              ))}
            </div>
          ) : (
            <Empty title="No classes" text="You're not assigned to any sections yet. Ask your school admin to add you as a section teacher." />
          )
        }
      </Async>
    </>
  );
}

function GradeView({ grade }) {
  const app = useApp();
  const state = useApi(() => api.grade(grade), [grade]);
  const name = `Class ${grade}`;

  return (
    <>
      <Breadcrumb items={[{ label: "Classes", to: "/classes" }, { label: name }]} />
      <div style={headRow}>
        <h1 className="h1" style={h1}>
          {name}
        </h1>
        {app.canEdit && <Button onClick={() => app.openAssign({ grade: Number(grade), pickLab: true })}>+ Assign lab to {name}</Button>}
      </div>
      <Async state={state}>
        {(d) => (
          <>
            <div style={autoGrid(250, 14, "auto-fill")}>
              {d.sections.map((s, i) => (
                <div
                  key={s.id}
                  {...clickable(() => navigate(path("classes", grade, s.id)))}
                  className="hov-border"
                  style={{ background: "#fff", border: `2px solid ${C.border}`, borderBottomWidth: 5, borderRadius: 18, padding: 18, cursor: "pointer", display: "flex", flexDirection: "column", gap: 10 }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: SECTION_COLORS[i % SECTION_COLORS.length], color: "#fff", display: "grid", placeItems: "center", font: fr(700, 20), flex: "none" }}>
                      {s.section}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 15 }}>Section {s.section}</div>
                      <div style={sub}>
                        {s.teacher || "No teacher"} · {s.students} students
                      </div>
                    </div>
                    <JoinCode code={s.joinCode} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 4 }}>
                    <Metric value={`${s.donePct}%`} label="LABS DONE" color={C.green} />
                    <Metric value={pctText(s.quizAvg)} label="QUIZ AVG" color={C.blue} />
                    <Metric value={num(s.avgXp)} label="AVG XP" color={C.amber} />
                  </div>
                </div>
              ))}
            </div>

            <Card>
              <div style={h2}>Assigned labs · {name}</div>
              {d.assignments.length ? (
                <div className="scroll-x">
                  {d.assignments.map((a) => {
                    const due = dueInfo(a.dueAt);
                    const first = d.sections.find((s) => s.section === a.sections[0]);
                    return (
                      <div
                        key={a.labId}
                        {...clickable(() => navigate(path("labs", a.labId, first?.id)))}
                        className="hov-bg"
                        style={{ display: "grid", gridTemplateColumns: "44px minmax(160px,1fr) 160px 120px 90px", minWidth: 620, alignItems: "center", gap: 14, padding: "10px 8px", borderRadius: 12, cursor: "pointer" }}
                      >
                        <Tile text={a.abbr} bg={subjectColor(a.subject)} size={40} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: 14 }}>{a.title}</div>
                          <div style={sub}>
                            {a.subject} · {a.sections.length > 1 ? "Sections" : "Section"} {a.sections.join(", ")}
                          </div>
                        </div>
                        <Bar pct={a.pct} height={10} />
                        <div style={{ fontSize: 12, fontWeight: 800, color: C.muted }}>
                          {a.done}/{a.students} completed
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: due.color, textAlign: "right" }}>{due.text}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Empty
                  compact
                  title={`No labs assigned to ${name} yet`}
                  text="Assigned labs show up on students' devices and work offline."
                  action={
                    app.canEdit && (
                      <Button size="sm" onClick={() => app.openAssign({ grade: Number(grade), pickLab: true })}>
                        + Assign a lab
                      </Button>
                    )
                  }
                />
              )}
            </Card>
          </>
        )}
      </Async>
    </>
  );
}

function Metric({ value, label, color }) {
  return (
    <div>
      <div style={{ font: fr(600, 20), color }}>{value}</div>
      <div style={{ fontSize: 10, fontWeight: 800, color: C.muted }}>{label}</div>
    </div>
  );
}

function JoinCode({ code }) {
  if (!code) return null;
  return (
    <div title="Students enter this code in the LabVR app to join the section" style={{ textAlign: "right", flex: "none" }}>
      <div style={{ fontSize: 9, fontWeight: 800, color: C.muted, letterSpacing: ".08em" }}>JOIN CODE</div>
      <div style={{ font: fr(600, 13), letterSpacing: ".06em" }}>{code}</div>
    </div>
  );
}

const COLS = "40px minmax(160px,1fr) 110px 130px 110px 110px 110px";

function SectionView({ grade, classId }) {
  const app = useApp();
  const [search, setSearch] = useState("");
  const state = useApi(() => api.section(classId), [classId]);
  const k = state.data?.class;
  const name = `Class ${k?.grade ?? grade}`;

  return (
    <>
      <Breadcrumb items={[{ label: "Classes", to: "/classes" }, { label: name, to: path("classes", grade) }, { label: k ? `Section ${k.section}` : "Section" }]} />
      <Async state={state}>
        {(d) => {
          const term = search.trim().toLowerCase();
          const rows = d.students.filter((s) => !term || s.name.toLowerCase().includes(term) || String(s.roll ?? "").includes(term));
          return (
            <>
              <div style={headRow}>
                <div>
                  <h1 className="h1" style={h1}>
                    {name} · Section {d.class.section}
                  </h1>
                  <div style={{ fontSize: 13, color: C.muted, fontWeight: 700, marginTop: 4 }}>
                    {d.class.teacher || "No teacher"} · {d.students.length} students · Join code{" "}
                    <span style={{ font: fr(600, 13), color: C.ink, letterSpacing: ".06em" }}>{d.class.joinCode}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <input
                    className="field"
                    type="search"
                    placeholder="Search students"
                    aria-label="Search students"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ ...fieldStyle, font: nu(700, 14), padding: "10px 14px", width: 220, maxWidth: "100%" }}
                  />
                  {app.canEdit && (
                    <Button onClick={() => app.openAssign({ grade: d.class.grade, classIds: [d.class.id], pickLab: true })} style={{ padding: "10px 18px" }}>
                      + Assign lab
                    </Button>
                  )}
                </div>
              </div>

              {d.students.length ? (
                <div style={{ background: "#fff", border: `2px solid ${C.border}`, borderRadius: 18, overflowX: "auto" }}>
                  <div style={{ display: "grid", minWidth: 760, gridTemplateColumns: COLS, gap: 12, padding: "12px 18px", background: C.page, fontSize: 11, fontWeight: 800, color: C.muted, letterSpacing: ".06em" }}>
                    <div>#</div>
                    <div>STUDENT</div>
                    <div>XP</div>
                    <div>LABS DONE</div>
                    <div>PRECISION</div>
                    <div>QUIZ AVG</div>
                    <div>LAST ACTIVE</div>
                  </div>
                  {rows.map((s) => (
                    <div
                      key={s.id}
                      {...clickable(() => navigate(path("classes", d.class.grade, d.class.id, s.id)))}
                      className="hov-row"
                      style={{ display: "grid", minWidth: 760, gridTemplateColumns: COLS, gap: 12, padding: "12px 18px", borderTop: `1px solid ${C.track}`, alignItems: "center", cursor: "pointer" }}
                    >
                      <div style={{ fontWeight: 800, color: C.muted, fontSize: 13 }}>{dash(s.roll)}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                        <Avatar name={s.name} bg={colorFor(s.name)} />
                        <div style={{ fontWeight: 800, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                      </div>
                      <div style={{ font: fr(600, 16), color: C.amber }}>★ {num(s.xp)}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Bar pct={s.labsTotal ? (s.labsDone / s.labsTotal) * 100 : 0} style={{ flex: 1 }} />
                        <span style={{ fontSize: 12, fontWeight: 800 }}>
                          {s.labsDone}/{s.labsTotal}
                        </span>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 14 }}>{pctText(s.precision)}</div>
                      <div style={{ fontWeight: 800, fontSize: 14, color: scoreColor(s.quizAvg) }}>{pctText(s.quizAvg)}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>{relativeDay(s.lastActiveAt)}</div>
                    </div>
                  ))}
                  {!rows.length && <div style={{ padding: "22px 18px", borderTop: `1px solid ${C.track}`, ...sub, fontSize: 13 }}>No students match “{search}”.</div>}
                </div>
              ) : (
                <Empty
                  title="No students yet"
                  text={`Students join this section from the LabVR app with the code ${d.class.joinCode}.`}
                />
              )}
            </>
          );
        }}
      </Async>
    </>
  );
}
