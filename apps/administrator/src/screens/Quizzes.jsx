import { useState } from "react";
import { api } from "../api.js";
import { useApi, useApp } from "../app-context.js";
import { MODE, scoreColor, shortDate } from "../lib/format.js";
import { navigate, path } from "../route.js";
import { Pill } from "../ui/bits.jsx";
import { Button } from "../ui/Button.jsx";
import { Async, Empty } from "../ui/states.jsx";
import { autoGrid, C, fr, h1, headRow, sub } from "../ui/theme.js";

function stateText(q) {
  switch (q.state) {
    case "live":
      return ["● Live now", C.red];
    case "auto":
      return ["Auto after lab", C.green];
    case "draft":
      return ["Draft", C.muted];
    case "done":
      return [`Completed ${shortDate(q.lastResponseAt || q.updatedAt)}`, C.green];
    default:
      return ["Ready", C.blue];
  }
}

/** Opens (or creates) the live session for a quiz and goes to the host screen. */
export async function hostQuiz(quizId, app) {
  const res = await api.host(quizId);
  navigate(path("quizzes", "live", res.session.id));
  app.refresh();
}

export default function Quizzes() {
  const app = useApp();
  const state = useApi(() => api.quizzes(), []);

  return (
    <>
      <div style={headRow}>
        <div>
          <h1 className="h1" style={h1}>
            Quizzes
          </h1>
          <div style={{ fontSize: 13, color: C.muted, fontWeight: 700, marginTop: 4 }}>Live quizzes you host, and default post-lab quizzes that run automatically</div>
        </div>
        {app.canEdit && (
          <Button variant="purple" onClick={() => navigate("/quizzes/new")}>
            + New quiz
          </Button>
        )}
      </div>
      <Async state={state}>
        {(d) =>
          d.quizzes.length ? (
            <div style={autoGrid(300, 14, "auto-fill")}>
              {d.quizzes.map((q) => (
                <QuizCard key={q.id} q={q} />
              ))}
            </div>
          ) : (
            <Empty
              title="No quizzes yet"
              text="Build a live quiz to run in class, or link one to a lab so it runs after the bench."
              action={
                app.canEdit && (
                  <Button variant="purple" size="sm" onClick={() => navigate("/quizzes/new")}>
                    + New quiz
                  </Button>
                )
              }
            />
          )
        }
      </Async>
    </>
  );
}

function QuizCard({ q }) {
  const app = useApp();
  const [busy, setBusy] = useState(false);
  const [state, stateColor] = stateText(q);
  const mode = MODE[q.mode] || MODE.LIVE;
  const canHost = app.canEdit && q.mode === "LIVE" && q.state !== "done";
  const canEdit = app.canEdit && q.state !== "live";

  async function host() {
    if (q.liveSessionId) return navigate(path("quizzes", "live", q.liveSessionId));
    setBusy(true);
    try {
      await hostQuiz(q.id, app);
    } catch (e) {
      app.toast(e.message, "error");
      setBusy(false);
    }
  }

  return (
    <div style={{ background: "#fff", border: `2px solid ${C.border}`, borderBottomWidth: 5, borderRadius: 18, padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <Pill bg={mode.bg}>{mode.label}</Pill>
        <span style={{ fontSize: 12, fontWeight: 800, color: stateColor }}>{state}</span>
      </div>
      <div style={{ fontWeight: 800, fontSize: 16 }}>{q.title}</div>
      <div style={sub}>
        {q.who} · {q.questions} {q.questions === 1 ? "question" : "questions"}
        {q.mode === "LIVE" && q.labTitle ? ` · ${q.labTitle}` : ""}
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
        <div>
          <div style={{ font: fr(600, 22), color: scoreColor(q.avg) }}>{q.avg === null ? "—" : `${q.avg}%`}</div>
          <div style={{ fontSize: 10, fontWeight: 800, color: C.muted }}>AVG SCORE</div>
        </div>
        <div>
          <div style={{ font: fr(600, 22) }}>{q.responses}</div>
          <div style={{ fontSize: 10, fontWeight: 800, color: C.muted }}>RESPONSES</div>
        </div>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <Button variant="outline" size="xs" onClick={() => navigate(path("quizzes", q.id, "results"))} style={{ flex: 1, padding: 8 }}>
          Results
        </Button>
        {canHost && (
          <Button variant="dark" size="xs" busy={busy} onClick={host} style={{ flex: 1, padding: 10 }}>
            {q.liveSessionId ? "Open host view" : "Host live"}
          </Button>
        )}
        {canEdit && (
          <Button variant="outline" size="xs" onClick={() => navigate(path("quizzes", q.id, "edit"))} style={{ padding: "8px 12px" }}>
            Edit
          </Button>
        )}
      </div>
    </div>
  );
}
