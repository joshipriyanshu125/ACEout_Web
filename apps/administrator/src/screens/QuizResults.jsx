import { useState } from "react";
import { api } from "../api.js";
import { useApi, useApp } from "../app-context.js";
import { colorFor, downloadCSV, MODE, pctText, scoreColor, shortDate, slug } from "../lib/format.js";
import { navigate, path } from "../route.js";
import { Avatar, Bar, Breadcrumb, Card, clickable, Pill, StatCard } from "../ui/bits.jsx";
import { Button } from "../ui/Button.jsx";
import { Async, Empty } from "../ui/states.jsx";
import { autoGrid, C, fr, h1, h2, headRow, label, sub } from "../ui/theme.js";

const COLS = "36px minmax(140px,1fr) 70px 90px 80px";
const clip = (t, n = 44) => (t.length > n ? `${t.slice(0, n)}…` : t);

// The results endpoint labels after-lab quizzes "Not assigned yet" (it doesn't
// look at the lab's assignments); the quiz list does, so borrow its label.
async function withAudience(r) {
  if (r.quiz.mode !== "AFTER_LAB") return r;
  try {
    const card = (await api.quizzes()).quizzes.find((q) => q.id === r.quiz.id);
    if (card) return { ...r, quiz: { ...r.quiz, who: card.who } };
  } catch {
    /* keep the server's label */
  }
  return r;
}

export default function QuizResults({ quizId, sessionId }) {
  const state = useApi(() => api.results(quizId, sessionId).then(withAudience), [quizId, sessionId]);
  return (
    <>
      <Breadcrumb items={[{ label: "Quizzes", to: "/quizzes" }, { label: state.data?.quiz.title || "Results" }]} />
      <Async state={state}>{(d) => <Results d={d} />}</Async>
    </>
  );
}

function Results({ d }) {
  const app = useApp();
  const [sentAt, setSentAt] = useState(d.quiz.reportsSentAt);
  const [sending, setSending] = useState(false);
  const quiz = d.quiz;
  const mode = MODE[quiz.mode] || MODE.LIVE;
  const st = d.stats;
  const when = d.session ? shortDate(d.session.endedAt || d.session.startedAt) : quiz.mode === "AFTER_LAB" ? "Auto · ongoing" : "Not hosted yet";

  const stats = [
    { label: "AVG SCORE", value: pctText(st.avg), sub: st.schoolAvg === null ? "no school average yet" : `school avg ${st.schoolAvg}%`, color: C.purple },
    { label: "RESPONSES", value: String(st.responses), sub: `of ${st.assigned} assigned`, color: C.blue },
    { label: "HARDEST QUESTION", value: st.hardest ? `Q${st.hardest.number}` : "—", sub: st.hardest ? `${st.hardest.pct}% correct` : "no answers yet", color: C.red },
    { label: "MEDIAN TIME", value: st.medianSeconds === null ? "—" : `${st.medianSeconds} s`, sub: "per question", color: C.amber },
  ];

  async function send() {
    setSending(true);
    try {
      const r = await api.sendReports(quiz.id);
      setSentAt(r.reportsSentAt);
      app.toast(`Reports sent to ${d.rows.length} students`);
    } catch (e) {
      app.toast(e.message, "error");
    } finally {
      setSending(false);
    }
  }

  function exportCSV() {
    downloadCSV(
      `${slug(quiz.title)}-results.csv`,
      ["Rank", "Student", "Class", "Section", "Score %", "Correct", "Questions", "Points", "Date"],
      d.rows.map((r) => [r.rank, r.name, r.grade ?? "", r.section, r.score, r.correct, r.total, r.points, r.at ? new Date(r.at).toISOString().slice(0, 10) : ""]),
    );
  }

  return (
    <>
      <div style={headRow}>
        <div style={{ minWidth: 0 }}>
          <Pill bg={mode.bg}>{mode.label}</Pill>
          <h1 className="h1" style={{ ...h1, font: fr(600, 30, 1.1), margin: "6px 0 0" }}>
            {quiz.title}
          </h1>
          <div style={{ fontSize: 13, color: C.muted, fontWeight: 700, marginTop: 4 }}>
            {quiz.who} · {when} · {st.responses} {st.responses === 1 ? "response" : "responses"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button variant="secondary" onClick={exportCSV} disabled={!d.rows.length} style={{ padding: "10px 18px" }}>
            Export CSV
          </Button>
          {app.canEdit &&
            (sentAt ? (
              <Button variant="secondary" disabled style={{ padding: "10px 18px" }}>
                ✓ Reports sent · {shortDate(sentAt)}
              </Button>
            ) : (
              <Button onClick={send} busy={sending} disabled={!d.rows.length}>
                Send reports to students
              </Button>
            ))}
        </div>
      </div>

      <div style={autoGrid(150)}>
        {stats.map((x) => (
          <StatCard key={x.label} {...x} size={30} />
        ))}
      </div>

      <div style={{ ...autoGrid(300, 18), alignItems: "start" }}>
        <div style={{ background: "#fff", border: `2px solid ${C.border}`, borderRadius: 18, overflow: "hidden", minWidth: 0 }}>
          <div style={{ padding: "16px 18px", ...h2 }}>Leaderboard</div>
          {d.rows.length ? (
            <div className="scroll-x">
              {d.rows.map((r) => (
                <div
                  key={r.studentId}
                  {...clickable(() => navigate(path("students", r.studentId)))}
                  className="hov-row"
                  style={{ display: "grid", gridTemplateColumns: COLS, minWidth: 440, gap: 12, padding: "11px 18px", borderTop: `1px solid ${C.track}`, alignItems: "center", cursor: "pointer" }}
                >
                  <div style={{ font: fr(600, 16), color: r.rank <= 3 ? C.amber : C.muted }}>{r.rank}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <Avatar name={r.name} size={30} bg={colorFor(r.name)} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
                      <div style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>
                        {r.grade ? `Class ${r.grade} · ` : ""}Sec {r.section}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 13, color: scoreColor(r.score) }}>{r.score}%</div>
                  <div style={sub}>
                    {r.correct}/{r.total} correct
                  </div>
                  <div style={{ font: fr(600, 15), color: C.amber }}>{r.points}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: "0 18px 18px" }}>
              <Empty compact text={quiz.mode === "LIVE" ? "No one has played this quiz yet. Host it live to collect responses." : "No student has finished the linked lab's quiz yet."} />
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
          <Card pad={18} gap={14}>
            <div style={h2}>Accuracy by question</div>
            {d.accuracy.length ? (
              d.accuracy.map((q) => (
                <div key={q.number} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13 }}>
                    <span style={{ fontWeight: 800, minWidth: 0 }} title={q.text}>
                      Q{q.number} · {clip(q.text)}
                    </span>
                    <span style={{ fontWeight: 800, color: scoreColor(q.pct), flex: "none" }}>{pctText(q.pct)}</span>
                  </div>
                  <Bar pct={q.pct ?? 0} height={10} color={scoreColor(q.pct)} />
                  <div style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>
                    {q.answered === 0 ? "No answers yet" : q.commonWrong ? `Most common wrong answer: “${q.commonWrong}”` : `${q.answered} answered · no wrong answers`}
                  </div>
                </div>
              ))
            ) : (
              <div style={sub}>This quiz has no questions.</div>
            )}
          </Card>
          <div style={{ background: "#FDF0EE", border: "2px solid #F5CFC9", borderRadius: 18, padding: 16, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ ...label, color: C.red }}>NEEDS ATTENTION</div>
            <div style={{ fontWeight: 800, fontSize: 14 }}>
              {d.lowCount} {d.lowCount === 1 ? "student" : "students"} scored under 50%
            </div>
            <div style={sub}>Re-assign the lab with the “guided” hint level, or host a revision quiz.</div>
          </div>
        </div>
      </div>
    </>
  );
}
