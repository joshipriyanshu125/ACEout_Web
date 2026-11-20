import { useEffect } from "react";
import { api } from "../api.js";
import { useApi, useApp } from "../app-context.js";
import { dueInfo, greeting, greetName, headerDate, MODE, num, relativeDay, scoreColor, subjectColor } from "../lib/format.js";
import { go, navigate, path } from "../route.js";
import { Bar, Card, clickable, Legend, Pill, StatCard, Tile } from "../ui/bits.jsx";
import { Button } from "../ui/Button.jsx";
import { Async, Empty } from "../ui/states.jsx";
import { autoGrid, C, fr, h1, h2, headRow, label, sub } from "../ui/theme.js";

function weekDelta(now, before) {
  if (!before) return now ? `${num(now)} this week` : "none yet this week";
  const d = Math.round(((now - before) / before) * 100);
  return `${d >= 0 ? "+" : ""}${d}% vs last week`;
}

export default function Dashboard() {
  const app = useApp();
  const state = useApi(() => api.dashboard(), []);
  const { reload } = state;

  // Refresh quietly so a quiz going live (or ending) shows up on its own.
  useEffect(() => {
    const t = setInterval(reload, 20000);
    return () => clearInterval(t);
  }, [reload]);

  return (
    <>
      <div style={headRow}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.muted, letterSpacing: ".06em" }}>{headerDate()}</div>
          <h1 className="h1" style={{ ...h1, marginTop: 4 }}>
            {greeting()}, {greetName(app.user.name)}
          </h1>
        </div>
        {app.canEdit && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button onClick={() => navigate("/labs")}>+ Assign a lab</Button>
            <Button variant="secondary" onClick={() => navigate("/quizzes/new")}>
              + New quiz
            </Button>
          </div>
        )}
      </div>

      <Async state={state}>{(d) => <DashboardBody d={d} />}</Async>
    </>
  );
}

function DashboardBody({ d }) {
  const app = useApp();
  const s = d.stats;
  const stats = [
    { label: "LABS COMPLETED", value: num(s.labsCompleted), sub: weekDelta(s.labsCompletedThisWeek, s.labsCompletedLastWeek), color: C.green },
    {
      label: "ACTIVE ASSIGNMENTS",
      value: num(s.activeAssignments),
      sub: `across ${s.classesWithAssignments} ${s.classesWithAssignments === 1 ? "class" : "classes"}`,
      color: C.blue,
    },
    {
      label: "AVG POST-LAB QUIZ",
      value: s.avgQuiz === null ? "—" : `${s.avgQuiz}%`,
      sub: s.quizzesGraded ? `${num(s.quizzesGraded)} quizzes graded` : "no quizzes graded yet",
      color: C.purple,
    },
    { label: "ACTIVE STUDENTS", value: num(s.activeStudents), sub: `of ${num(s.totalStudents)} · in the last 24 h`, color: C.amber },
  ];

  return (
    <>
      <div style={autoGrid(150)}>
        {stats.map((x) => (
          <StatCard key={x.label} {...x} />
        ))}
      </div>

      <div style={{ ...autoGrid(320, 18), alignItems: "start" }}>
        <Card gap={14}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={h2}>Lab completion by class</div>
            <div style={sub}>Active assignments · this term</div>
          </div>
          {d.classProgress.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {d.classProgress.map((c) => (
                <div
                  key={c.grade}
                  {...clickable(() => navigate(path("classes", c.grade)))}
                  className="hov-bg"
                  style={{ display: "grid", gridTemplateColumns: "72px 1fr 48px", alignItems: "center", gap: 12, cursor: "pointer", padding: "4px 6px", borderRadius: 10 }}
                >
                  <div style={{ fontWeight: 800, fontSize: 14 }}>{c.name}</div>
                  <Bar
                    height={14}
                    parts={[
                      { pct: c.donePct, color: C.green },
                      { pct: c.progPct, color: C.amber },
                    ]}
                  />
                  <div style={{ font: fr(600, 15), textAlign: "right", color: C.green }}>{c.donePct}%</div>
                </div>
              ))}
            </div>
          ) : (
            <Empty compact title="No classes yet" text="Sections you can see will show up here." />
          )}
          <Legend
            items={[
              ["Completed", C.green],
              ["In progress", C.amber],
              ["Not started", C.track],
            ]}
          />
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
          {d.live ? (
            <LiveCard live={d.live} />
          ) : (
            <div style={{ background: "#fff", border: `2px dashed ${C.dashed}`, borderRadius: 18, padding: 20, display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between", flexWrap: "wrap" }}>
              <div>
                <div style={{ ...label }}>NO LIVE QUIZ</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.muted, marginTop: 4 }}>Host one and students join from the app with a code.</div>
              </div>
              {app.canEdit && (
                <Button variant="secondary" size="sm" onClick={() => navigate("/quizzes/new")}>
                  + New quiz
                </Button>
              )}
            </div>
          )}

          <Card>
            <div style={h2}>Due soon</div>
            {d.dueSoon.length ? (
              d.dueSoon.map((x) => {
                const due = dueInfo(x.dueAt);
                return (
                  <div
                    key={x.labId + x.grade}
                    {...clickable(() => navigate(path("labs", x.labId)))}
                    style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
                  >
                    <Tile text={x.abbr} bg={subjectColor(x.subject)} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{x.title}</div>
                      <div style={sub}>
                        Class {x.grade} · {x.sections.join(", ")} · {x.done}/{x.students} done
                      </div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: x.overdue ? C.red : C.muted, flex: "none" }}>{due.text}</div>
                  </div>
                );
              })
            ) : (
              <Empty compact text="Nothing due in the next few days." />
            )}
          </Card>
        </div>
      </div>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={h2}>Recent quiz results</div>
          <a href="#/quizzes" onClick={go("/quizzes")} style={{ fontSize: 13, fontWeight: 800 }}>
            All quizzes →
          </a>
        </div>
        {d.recentQuizzes.length ? (
          <div style={autoGrid(220, 12)}>
            {d.recentQuizzes.map((q) => (
              <div
                key={q.id}
                {...clickable(() => navigate(path("quizzes", q.id, "results")))}
                className="hov-border"
                style={{ border: `2px solid ${C.border}`, borderRadius: 14, padding: 14, display: "flex", flexDirection: "column", gap: 8, cursor: "pointer", minWidth: 0 }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <Pill bg={MODE[q.mode]?.bg}>{MODE[q.mode]?.label}</Pill>
                  <span style={sub}>{relativeDay(q.lastResponseAt)}</span>
                </div>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{q.title}</div>
                <div style={sub}>{q.who}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ font: fr(600, 26), color: scoreColor(q.avg) }}>{q.avg === null ? "—" : `${q.avg}%`}</span>
                  <span style={sub}>
                    avg · {q.responses} {q.responses === 1 ? "student" : "students"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty compact text="No quiz responses yet. Results appear here once students answer a quiz." />
        )}
      </Card>
    </>
  );
}

function LiveCard({ live }) {
  const lobby = live.status === "LOBBY";
  return (
    <div style={{ background: C.ink, borderRadius: 18, padding: 20, color: "#fff", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 800, letterSpacing: ".08em", color: C.red }}>
        <i style={{ width: 8, height: 8, borderRadius: "50%", background: C.red, display: "inline-block", animation: "pulse 1.2s infinite" }} />
        LIVE NOW
      </div>
      <div style={{ font: fr(600, 20, 1.2) }}>{live.title}</div>
      <div style={{ fontSize: 13, color: C.onDark, fontWeight: 700 }}>{[live.audience || "Open to anyone with the code", live.host && `hosted by ${live.host}`].filter(Boolean).join(" · ")}</div>
      <div style={{ display: "flex", gap: 18, marginTop: 4 }}>
        <div>
          <div style={{ font: fr(600, 24), color: C.mint }}>{live.joined}</div>
          <div style={{ fontSize: 11, color: C.onDark, fontWeight: 700 }}>JOINED</div>
        </div>
        <div>
          <div style={{ font: fr(600, 24) }}>
            {lobby ? (
              "Lobby"
            ) : (
              <>
                Q{live.index + 1}
                <span style={{ color: C.onDark, fontSize: 16 }}>/{live.questionCount}</span>
              </>
            )}
          </div>
          <div style={{ fontSize: 11, color: C.onDark, fontWeight: 700 }}>{lobby ? "WAITING TO START" : "QUESTION"}</div>
        </div>
      </div>
      <Button variant="light" size="sm" onClick={() => navigate(path("quizzes", "live", live.id))} style={{ marginTop: 4, padding: 10 }}>
        Open host view
      </Button>
    </div>
  );
}
