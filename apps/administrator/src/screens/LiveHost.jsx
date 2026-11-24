import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import { useApp } from "../app-context.js";
import { colorFor, initials, spacedCode } from "../lib/format.js";
import { navigate, path } from "../route.js";
import { Breadcrumb } from "../ui/bits.jsx";
import { Button } from "../ui/Button.jsx";
import { ErrorState, Loading } from "../ui/states.jsx";
import { C, fr } from "../ui/theme.js";
import { hostQuiz } from "./Quizzes.jsx";

const TILES = [C.blue, C.red, C.amber, C.green, C.purple, C.teal];
const POLL_MS = 1000;

/** Polls the session about once a second while the screen is open. */
function useSession(sessionId) {
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);
  const [stale, setStale] = useState(false);
  const timer = useRef();
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    async function tick() {
      try {
        const res = await api.session(sessionId);
        if (!alive.current) return;
        setSession(res.session);
        setError(null);
        setStale(false);
        if (res.session.status === "DONE") return; // nothing changes after the end
      } catch (e) {
        if (!alive.current) return;
        if (e.status === 404 || e.status === 403) return setError(e);
        setStale(true);
      }
      timer.current = setTimeout(tick, POLL_MS);
    }
    tick();
    return () => {
      alive.current = false;
      clearTimeout(timer.current);
    };
  }, [sessionId]);

  return { session, setSession, error, stale };
}

export default function LiveHost({ sessionId }) {
  const app = useApp();
  const { session: s, setSession, error, stale } = useSession(sessionId);
  const [busy, setBusy] = useState("");

  async function act(action) {
    if (action === "end" && !window.confirm("End this live session for everyone?")) return;
    setBusy(action);
    try {
      const res = await api.sessionAction(sessionId, action);
      setSession(res.session);
      if (action === "end" || res.session.status === "DONE") app.refresh();
    } catch (e) {
      app.toast(e.message, "error");
    } finally {
      setBusy("");
    }
  }

  /** Starts a fresh session of the same quiz; past runs keep their results. */
  async function runAgain() {
    setBusy("again");
    try {
      await hostQuiz(s.quiz.id, app);
    } catch (e) {
      app.toast(e.message, "error");
      setBusy("");
    }
  }

  const crumbs = <Breadcrumb items={[{ label: "Quizzes", to: "/quizzes" }, { label: `Live host · ${s?.quiz.title || "…"}` }]} />;
  if (error) {
    return (
      <>
        {crumbs}
        <ErrorState title="Can't open this session" error={error} />
      </>
    );
  }
  if (!s) {
    return (
      <>
        {crumbs}
        <div style={{ background: C.ink, borderRadius: 24, minHeight: 360, display: "grid", placeItems: "center" }}>
          <Loading dark text="Connecting to the live session…" />
        </div>
      </>
    );
  }

  const q = s.question;
  const inQuestion = s.status === "QUESTION" || s.status === "REVEAL";
  const revealed = s.status === "REVEAL";
  const total = s.counts.reduce((a, b) => a + b, 0) || 1;
  const secsMax = q?.seconds || 20;
  const timerPct = s.status === "QUESTION" ? Math.round((s.secondsLeft / secsMax) * 100) : 0;
  const control = app.canEdit;
  const board = s.leaderboard || [];
  const podium = [board[1], board[0], board[2]]
    .map((p, i) => p && { ...p, place: [2, 1, 3][i], h: [120, 170, 95][i], bg: [C.blue, C.amber, C.red][i] })
    .filter(Boolean);

  return (
    <>
      {crumbs}
      <div className="live-grid" style={{ background: C.ink, borderRadius: 24, padding: "clamp(18px, 3vw, 28px)", color: "#fff", minHeight: 560 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 22, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              {s.status === "DONE" ? (
                <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".08em", color: C.onDark }}>ENDED</span>
              ) : (
                <>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: C.red, animation: "pulse 1.2s infinite", display: "inline-block" }} />
                  <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".08em", color: C.red }}>LIVE</span>
                </>
              )}
              <span style={{ fontSize: 13, color: C.onDark, fontWeight: 700 }}>{s.quiz.audience || "Anyone with the code"}</span>
              {stale && <span style={{ fontSize: 12, color: C.amber, fontWeight: 800 }}>Reconnecting…</span>}
            </div>
            {s.status !== "DONE" && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,.08)", padding: "8px 14px", borderRadius: 12, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: C.onDark, fontWeight: 800 }}>JOIN IN THE LABVR APP · CODE</span>
                <span style={{ font: fr(600, 24, 1), letterSpacing: ".12em" }}>{spacedCode(s.code)}</span>
              </div>
            )}
          </div>

          {s.status === "LOBBY" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, textAlign: "center" }}>
              <div style={{ font: fr(600, 44, 1.1) }}>
                {s.joined} <span style={{ color: C.onDark, fontSize: 26 }}>joined</span>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", maxWidth: 620 }}>
                {s.names.length ? (
                  s.names.map((n, i) => (
                    <span key={i} style={{ background: "rgba(255,255,255,.1)", padding: "6px 12px", borderRadius: 99, fontSize: 13, fontWeight: 800 }}>
                      {n}
                    </span>
                  ))
                ) : (
                  <span style={{ color: C.onDark, fontWeight: 700, fontSize: 14 }}>Waiting for students to join with the code…</span>
                )}
              </div>
              {control && (
                <Button variant="green" size="lg" busy={busy === "start"} onClick={() => act("start")} style={{ marginTop: 10 }}>
                  Start quiz
                </Button>
              )}
              {control && !s.joined && <div style={{ fontSize: 12, color: C.onDark, fontWeight: 700 }}>You can start before everyone joins; late joiners pick up at the current question.</div>}
            </div>
          )}

          {inQuestion && q && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".08em", color: C.onDark }}>
                  QUESTION {s.index + 1} OF {s.quiz.questionCount}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 120, height: 10, borderRadius: 99, background: "rgba(255,255,255,.12)", overflow: "hidden" }}>
                    <div style={{ width: `${timerPct}%`, height: "100%", background: s.secondsLeft <= 5 ? C.red : C.green, borderRadius: 99, transition: "width 1s linear" }} />
                  </div>
                  <div style={{ font: fr(600, 22, 1), minWidth: 40, textAlign: "right" }}>{revealed ? "0s" : `${s.secondsLeft}s`}</div>
                </div>
              </div>
              <div style={{ font: fr(600, 36, 1.2), fontSize: "clamp(22px, 3.4vw, 36px)" }}>{q.text}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))", gap: 12, marginTop: "auto" }}>
                {q.options.map((o, i) => {
                  const correct = revealed && q.correctIndex === i;
                  const numeric = q.type === "NUMERIC";
                  const bg = numeric ? (i === 0 ? C.green : C.red) : TILES[i % TILES.length];
                  const count = s.counts[i] || 0;
                  return (
                    <div
                      key={i}
                      style={{
                        position: "relative",
                        borderRadius: 16,
                        background: bg,
                        padding: "18px 18px 18px 20px",
                        overflow: "hidden",
                        minHeight: 92,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-end",
                        gap: 6,
                        border: `3px solid ${correct ? "#fff" : "transparent"}`,
                        opacity: revealed && !correct && !numeric ? 0.75 : 1,
                      }}
                    >
                      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${Math.round((count / total) * 100)}%`, background: "rgba(255,255,255,.18)", transition: "width .4s" }} />
                      <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 10 }}>
                        <div style={{ font: fr(600, 20), minWidth: 0, overflowWrap: "anywhere" }}>{o}</div>
                        <div style={{ font: fr(600, 28, 1) }}>{count}</div>
                      </div>
                      {correct && !numeric && <div style={{ position: "relative", fontSize: 11, fontWeight: 800, letterSpacing: ".08em" }}>✓ CORRECT</div>}
                    </div>
                  );
                })}
              </div>
              {revealed && (q.answer || q.explanation) && (
                <div style={{ background: "rgba(255,255,255,.08)", borderRadius: 12, padding: "10px 14px", fontSize: 14, fontWeight: 700, color: "#E9E4DA" }}>
                  {q.answer && (
                    <span style={{ fontWeight: 800, color: "#fff" }}>
                      Answer: {q.answer}
                      {q.explanation ? " · " : ""}
                    </span>
                  )}
                  {q.explanation}
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div style={{ fontSize: 14, color: C.onDark, fontWeight: 800 }}>
                  {s.answered} / {s.joined} answered
                </div>
                {control && (
                  <div style={{ display: "flex", gap: 10 }}>
                    {!revealed && (
                      <Button variant="light" busy={busy === "reveal"} onClick={() => act("reveal")} style={{ padding: "12px 22px" }}>
                        Reveal answer
                      </Button>
                    )}
                    {revealed && (
                      <Button busy={busy === "next"} onClick={() => act("next")} style={{ padding: "12px 22px" }}>
                        {s.isLast ? "Show podium" : "Next question"}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {s.status === "DONE" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, textAlign: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".08em", color: C.onDark }}>FINAL PODIUM</div>
              {podium.length ? (
                <div style={{ display: "flex", alignItems: "flex-end", gap: 14, flexWrap: "nowrap", maxWidth: "100%" }}>
                  {podium.map((p) => (
                    <div key={p.studentId} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 14, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                      <div style={{ width: "clamp(80px, 18vw, 120px)", height: p.h, background: p.bg, borderRadius: "14px 14px 0 0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", paddingTop: 14, gap: 4 }}>
                        <div style={{ font: fr(600, 30) }}>{p.place}</div>
                        <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.85 }}>{p.points} pts</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: C.onDark, fontWeight: 700 }}>Nobody joined this session.</div>
              )}
              <Button variant="light" onClick={() => navigate(path("quizzes", s.quiz.id, "results", s.id))} style={{ padding: "12px 22px", marginTop: 8 }}>
                Open full results
              </Button>
              {app.canEdit && (
                <Button variant="green" busy={busy === "again"} onClick={runAgain} style={{ padding: "12px 22px" }}>
                  Run quiz again
                </Button>
              )}
            </div>
          )}
        </div>

        <div style={{ background: "rgba(255,255,255,.06)", borderRadius: 18, padding: 18, display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".08em", color: C.onDark }}>LEADERBOARD</div>
          {board.length ? (
            board.slice(0, 8).map((b) => (
              <div key={b.studentId} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 22, font: fr(600, 14), color: C.onDark }}>{b.rank}</div>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: colorFor(b.name), display: "grid", placeItems: "center", font: fr(700, 11), flex: "none" }}>{b.initials || initials(b.name)}</div>
                <div style={{ flex: 1, fontWeight: 800, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.name}</div>
                <div style={{ font: fr(600, 14), color: C.mint }}>{b.points}</div>
              </div>
            ))
          ) : (
            <div style={{ fontSize: 13, color: C.onDark, fontWeight: 700 }}>Scores show up once students start answering.</div>
          )}
          <div style={{ flex: 1 }} />
          {s.status !== "DONE" && control ? (
            <Button variant="ghostDark" size="sm" busy={busy === "end"} onClick={() => act("end")} style={{ padding: 10 }}>
              End session
            </Button>
          ) : (
            <Button variant="ghostDark" size="sm" onClick={() => navigate("/quizzes")} style={{ padding: 10 }}>
              Back to quizzes
            </Button>
          )}
          {!control && s.status !== "DONE" && <div style={{ fontSize: 11, fontWeight: 700, color: C.onDark }}>Read-only view · the host controls this session.</div>}
        </div>
      </div>
    </>
  );
}
