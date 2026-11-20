import { useEffect, useState } from "react";
import { api } from "../api.js";
import { useApi, useApp } from "../app-context.js";
import { colorFor, dash, isNum, num, pctText, relativeDay, scoreColor, shortDate, STATUS, subjectColor } from "../lib/format.js";
import { navigate, path, useRoute } from "../route.js";
import { Avatar, Bar, Breadcrumb, Card, clickable, StatusPill, Tile } from "../ui/bits.jsx";
import { Button } from "../ui/Button.jsx";
import { Async, Empty } from "../ui/states.jsx";
import { C, fieldStyle, fr, h2, label, nu, sub } from "../ui/theme.js";

export default function StudentProfile({ studentId }) {
  const route = useRoute();
  const state = useApi(() => api.student(studentId), [studentId]);
  const d = state.data;

  // Reached from a quiz leaderboard (#/students/:id): swap in the canonical
  // classes path once we know the section, so the breadcrumb and back work.
  useEffect(() => {
    if (d && route.parts[0] === "students") {
      navigate(path("classes", d.class.grade, d.class.id, d.student.id), { replace: true });
    }
  }, [d, route.parts]);

  const k = d?.class;
  return (
    <>
      <Breadcrumb
        items={[
          { label: "Classes", to: "/classes" },
          ...(k
            ? [
                { label: `Class ${k.grade}`, to: path("classes", k.grade) },
                { label: `Section ${k.section}`, to: path("classes", k.grade, k.id) },
              ]
            : []),
          { label: d?.student.name || "Student" },
        ]}
      />
      <Async state={state}>{(data) => <Profile d={data} reload={state.reload} />}</Async>
    </>
  );
}

function Profile({ d, reload }) {
  const s = d.student;
  const boxes = [
    ["TOTAL XP", num(d.summary.xp), C.amber],
    ["PRECISION", pctText(d.summary.precision), C.green],
    ["FAULTS", num(d.summary.faults), C.red],
  ];
  return (
    <div className="split-grid">
      <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
        <div className="print-card" style={{ background: "#fff", border: `2px solid ${C.border}`, borderRadius: 18, padding: 22, display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
          <Avatar name={s.name} size={72} fontSize={26} bg={colorFor(s.name)} />
          <div style={{ flex: 1, minWidth: 180 }}>
            <h1 className="h1" style={{ margin: 0, font: fr(600, 28, 1.1) }}>
              {s.name}
            </h1>
            <div style={{ fontSize: 13, color: C.muted, fontWeight: 700, marginTop: 4 }}>
              Roll {dash(s.rollNo)} · Class {d.class.grade} · Section {d.class.section} · last active {relativeDay(s.lastActiveAt).toLowerCase()}
            </div>
            <div style={{ fontSize: 12, color: C.muted, fontWeight: 700, marginTop: 2 }}>
              {d.summary.labsDone}/{d.summary.labsTotal} labs done
              {isNum(d.summary.averageScore) ? ` · average mark ${d.summary.averageScore}` : ""}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {boxes.map(([text, value, color]) => (
              <div key={text} style={{ border: `2px solid ${color}`, borderRadius: 14, padding: "10px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 10, fontWeight: 800, color }}>{text}</div>
                <div style={{ font: fr(600, 24), color }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        <LabHistory labs={d.labs} reload={reload} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
        <Card pad={18}>
          <div style={h2}>Quiz scores</div>
          {d.quizzes.length ? (
            d.quizzes.map((q, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13 }}>
                  <span style={{ fontWeight: 800, minWidth: 0 }}>{q.title}</span>
                  <span style={{ fontWeight: 800, color: scoreColor(q.score), flex: "none" }}>{q.score}%</span>
                </div>
                <Bar pct={q.score} color={scoreColor(q.score)} />
                <div style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>
                  {q.mode} · {relativeDay(q.at)}
                </div>
              </div>
            ))
          ) : (
            <div style={sub}>No quiz scores yet.</div>
          )}
        </Card>
        <Card pad={18} gap={10}>
          <div style={h2}>Badges</div>
          {d.badges.length ? (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {d.badges.map((b) => (
                <div
                  key={b.id}
                  title={b.name}
                  aria-label={b.name}
                  style={{ width: 48, height: 48, background: b.bg, clipPath: "polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%)", display: "grid", placeItems: "center", color: "#fff", font: fr(700, 14) }}
                >
                  {b.icon}
                </div>
              ))}
            </div>
          ) : (
            <div style={sub}>No badges earned yet.</div>
          )}
          {d.badges.length > 0 && <div style={{ ...sub, fontSize: 11 }}>{d.badges.map((b) => b.name).join(" · ")}</div>}
        </Card>
        <Button variant="dark" className="no-print" onClick={() => window.print()} style={{ padding: 12 }}>
          Download report card (PDF)
        </Button>
      </div>
    </div>
  );
}

const COLS = "minmax(150px,1fr) 110px 86px 86px 70px 14px";

function LabHistory({ labs, reload }) {
  const [open, setOpen] = useState(null);
  return (
    <div className="print-card" style={{ background: "#fff", border: `2px solid ${C.border}`, borderRadius: 18, overflow: "hidden" }}>
      <div style={{ padding: "16px 18px", ...h2 }}>Lab history</div>
      {labs.length ? (
        <div className="scroll-x">
          <div style={{ display: "grid", minWidth: 560, gridTemplateColumns: COLS, gap: 12, padding: "10px 18px", background: C.page, fontSize: 11, fontWeight: 800, color: C.muted, letterSpacing: ".06em" }}>
            <div>LAB</div>
            <div>STATUS</div>
            <div>PRECISION</div>
            <div>POST-QUIZ</div>
            <div>DATE</div>
            <div />
          </div>
          {labs.map((l) => {
            const st = STATUS[l.status];
            const canOpen = Boolean(l.attempt);
            const isOpen = open === l.labId;
            return (
              <div key={l.labId} style={{ borderTop: `1px solid ${C.track}`, minWidth: 560 }}>
                <div
                  {...(canOpen ? clickable(() => setOpen(isOpen ? null : l.labId)) : {})}
                  aria-expanded={canOpen ? isOpen : undefined}
                  className={canOpen ? "hov-row" : ""}
                  style={{ display: "grid", gridTemplateColumns: COLS, gap: 12, padding: "12px 18px", alignItems: "center", cursor: canOpen ? "pointer" : "default" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <Tile text={l.abbr} bg={subjectColor(l.subject)} size={32} radius={8} fontSize={11} />
                    <div style={{ fontWeight: 800, fontSize: 13 }}>{l.title}</div>
                  </div>
                  <div>
                    <StatusPill status={st} />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 13 }}>{pctText(l.precision)}</div>
                  <div style={{ fontWeight: 800, fontSize: 13, color: scoreColor(l.quiz) }}>{pctText(l.quiz)}</div>
                  <div style={{ fontSize: 12, color: C.muted, fontWeight: 700 }}>{l.submittedAt ? shortDate(l.submittedAt) : "—"}</div>
                  <div aria-hidden="true" className="no-print" style={{ color: C.muted, fontWeight: 800, transform: isOpen ? "rotate(90deg)" : "none", transition: "transform .15s" }}>
                    {canOpen ? "›" : ""}
                  </div>
                </div>
                {isOpen && <AttemptDetail lab={l} reload={reload} />}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ padding: "0 18px 18px" }}>
          <Empty compact text="No labs are assigned to this student's section yet." />
        </div>
      )}
    </div>
  );
}

const UNITS = { S: "s", Ms: "ms", Kg: "kg", G: "g", Cm: "cm", Mm: "mm", M: "m", Deg: "°", Ml: "mL", L: "L", N: "N", J: "J", W: "W", V: "V", A: "A", Hz: "Hz", Pct: "%", C: "°C" };

/** "thetaDeg" → "Theta (°)", "solution" → "Solution". */
function columnLabel(key) {
  const words = String(key).replace(/([a-z0-9])([A-Z])/g, "$1 $2").split(/[\s_]+/);
  let unit = "";
  if (words.length > 1 && UNITS[words[words.length - 1]]) unit = UNITS[words.pop()];
  const text = words.join(" ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1) + (unit ? ` (${unit})` : "");
}

const cellText = (v) => (v === null || v === undefined ? "—" : typeof v === "boolean" ? (v ? "Yes" : "No") : typeof v === "object" ? JSON.stringify(v) : String(v));

function AttemptDetail({ lab, reload }) {
  const app = useApp();
  const a = lab.attempt;
  const done = lab.status === "COMPLETED";
  const [mark, setMark] = useState(a.overrideScore ?? "");
  const [remark, setRemark] = useState(a.teacherRemark ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const rows = Array.isArray(a.observations) ? a.observations.filter((o) => o && typeof o === "object") : [];
  const keys = [];
  for (const r of rows) for (const k of Object.keys(r)) if (!keys.includes(k)) keys.push(k);

  async function save(e) {
    e.preventDefault();
    const trimmed = String(mark).trim();
    if (trimmed !== "" && (!isNum(trimmed) || Number(trimmed) < 0 || Number(trimmed) > 100)) {
      setError("Mark must be a number between 0 and 100, or blank to use the auto mark.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api.gradeAttempt(a.id, { overrideScore: trimmed === "" ? null : Number(trimmed), teacherRemark: remark });
      app.toast(`Saved mark for “${lab.title}”`);
      reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ padding: "4px 18px 18px", display: "flex", flexDirection: "column", gap: 14, background: C.rowHover }}>
      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", fontSize: 13, fontWeight: 800, paddingTop: 10 }}>
        <span>
          Auto mark <span style={{ font: fr(600, 16) }}>{dash(a.autoScore)}</span>
        </span>
        <span>
          Final mark <span style={{ font: fr(600, 16), color: scoreColor(a.finalScore) }}>{dash(a.finalScore)}</span>
          {isNum(a.overrideScore) && <span style={{ ...sub, marginLeft: 6 }}>(overridden{a.gradedBy ? ` by ${a.gradedBy}` : ""})</span>}
        </span>
        {isNum(lab.faults) && <span>Faults {lab.faults}</span>}
        {isNum(lab.timeSpentSeconds) && <span>Time {Math.round(lab.timeSpentSeconds / 60)} min</span>}
        {a.late && <span style={{ color: C.red }}>Submitted late</span>}
        {!done && <span style={{ color: "#A46D12" }}>Still in progress</span>}
      </div>

      <div>
        <div style={{ ...label, marginBottom: 8 }}>READINGS</div>
        {rows.length ? (
          <div className="scroll-x" style={{ border: `2px solid ${C.border}`, borderRadius: 12, background: "#fff" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
              <thead>
                <tr style={{ background: C.page }}>
                  <th style={th}>#</th>
                  {keys.map((k) => (
                    <th key={k} style={th}>
                      {columnLabel(k)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${C.track}` }}>
                    <td style={{ ...td, color: C.muted }}>{i + 1}</td>
                    {keys.map((k) => (
                      <td key={k} style={td}>
                        {cellText(r[k])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={sub}>No readings recorded.</div>
        )}
      </div>

      {a.teacherRemark && !app.canEdit && (
        <div style={{ fontSize: 13, fontWeight: 700 }}>
          <span style={{ ...label, marginRight: 8 }}>REMARK</span>
          {a.teacherRemark}
        </div>
      )}

      {app.canEdit && done && (
        <form onSubmit={save} className="no-print" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, ...label, width: 130 }}>
            OVERRIDE MARK
            <input
              className="field"
              type="number"
              min="0"
              max="100"
              step="any"
              inputMode="decimal"
              placeholder={a.autoScore === null || a.autoScore === undefined ? "0–100" : `Auto ${a.autoScore}`}
              value={mark}
              onChange={(e) => setMark(e.target.value)}
              style={{ ...fieldStyle, font: nu(800, 14), letterSpacing: 0 }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, ...label, flex: 1, minWidth: 200 }}>
            REMARK (THE STUDENT SEES THIS)
            <input
              className="field"
              maxLength={500}
              placeholder="e.g. Good readings — check the zero error next time"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              style={{ ...fieldStyle, font: nu(700, 14), letterSpacing: 0 }}
            />
          </label>
          <Button type="submit" size="sm" busy={busy} style={{ padding: "12px 16px" }}>
            Save mark
          </Button>
          {error && <div role="alert" style={{ width: "100%", color: C.red, fontSize: 12, fontWeight: 800 }}>{error}</div>}
          <div style={{ width: "100%", ...sub, fontSize: 11 }}>Leave the mark blank to go back to the auto mark.</div>
        </form>
      )}
    </div>
  );
}

const th = { textAlign: "left", padding: "8px 12px", fontSize: 11, fontWeight: 800, color: C.muted, letterSpacing: ".04em", whiteSpace: "nowrap" };
const td = { padding: "8px 12px", fontWeight: 700, whiteSpace: "nowrap" };
