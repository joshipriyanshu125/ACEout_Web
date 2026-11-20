import { useRef, useState } from "react";
import { api } from "../api.js";
import { useApi, useApp } from "../app-context.js";
import { navigate, path } from "../route.js";
import { hostQuiz } from "./Quizzes.jsx";
import { Breadcrumb, clickable, Toggle } from "../ui/bits.jsx";
import { Button } from "../ui/Button.jsx";
import { Modal } from "../ui/Modal.jsx";
import { Async, Empty } from "../ui/states.jsx";
import { C, fieldStyle, fr, h2, label, nu, sub } from "../ui/theme.js";

const TYPES = [
  ["MCQ", "MCQ"],
  ["TRUE_FALSE", "True/False"],
  ["NUMERIC", "Numeric"],
];
const TYPE_LABEL = Object.fromEntries(TYPES);
const SECONDS = [15, 20, 30, 60];
const POINTS = [100, 200, 500];
const TILE = [C.blue, C.red, C.amber, C.green, C.purple, C.teal];

let keySeq = 0;
const newKey = () => `q${++keySeq}`;
const blankQuestion = () => ({ key: newKey(), text: "", type: "MCQ", options: ["", "", "", ""], correctIndex: 0, explanation: "", seconds: 20, points: 100 });

const fmtDuration = (secs) => `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")} min`;

export default function QuizBuilder({ quizId }) {
  const app = useApp();
  const state = useApi(() => Promise.all([api.options(), quizId ? api.quiz(quizId).then((r) => r.quiz) : null]).then(([options, quiz]) => ({ options, quiz })), [quizId]);

  if (!app.canEdit) {
    return (
      <>
        <Breadcrumb items={[{ label: "Quizzes", to: "/quizzes" }, { label: "Quiz builder" }]} />
        <Empty title="Read-only account" text="Your account can view quizzes and results but can't create or edit them." action={<Button variant="secondary" size="sm" onClick={() => navigate("/quizzes")}>Back to quizzes</Button>} />
      </>
    );
  }

  return (
    <>
      <Breadcrumb items={[{ label: "Quizzes", to: "/quizzes" }, { label: "Quiz builder" }]} />
      <Async state={state}>{(d) => <Builder quizId={quizId} options={d.options} initial={d.quiz} />}</Async>
    </>
  );
}

function fromServer(q) {
  if (!q) {
    return { title: "Untitled quiz", mode: "LIVE", labId: "", status: "DRAFT", shuffle: true, showLeaderboard: true, audience: [], questions: [blankQuestion()] };
  }
  return {
    title: q.title,
    mode: q.mode,
    labId: q.labId || "",
    status: q.status,
    shuffle: q.shuffle,
    showLeaderboard: q.showLeaderboard,
    audience: (q.audience || []).map((a) => a.id),
    questions: q.questions.length
      ? q.questions.map((x) => ({
          key: newKey(),
          text: x.text,
          type: x.type,
          options: Array.isArray(x.options) ? x.options.map(String) : [],
          correctIndex: x.correctIndex ?? 0,
          explanation: x.explanation || "",
          seconds: x.seconds,
          points: x.points,
        }))
      : [blankQuestion()],
  };
}

function validate(quiz) {
  if (!quiz.title.trim()) return { msg: "Give the quiz a title." };
  if (quiz.mode === "AFTER_LAB" && !quiz.labId) return { msg: "An after-lab quiz needs a linked lab." };
  for (let i = 0; i < quiz.questions.length; i++) {
    const q = quiz.questions[i];
    const n = i + 1;
    if (!q.text.trim()) return { msg: `Question ${n} has no text.`, index: i };
    if (q.type === "MCQ") {
      if (q.options.length < 2) return { msg: `Question ${n} needs at least two options.`, index: i };
      if (q.options.some((o) => !o.trim())) return { msg: `Question ${n}: fill in every option, or remove the empty ones.`, index: i };
    }
    if (q.type === "NUMERIC") {
      const v = String(q.options[0] ?? "").trim();
      if (!v || !Number.isFinite(Number(v.replace(/[^\d.eE+-]/g, "")))) return { msg: `Question ${n} needs a numeric correct answer.`, index: i };
    }
  }
  return null;
}

function Builder({ quizId, options, initial }) {
  const app = useApp();
  const [quiz, setQuiz] = useState(() => fromServer(initial));
  const [cur, setCur] = useState(0);
  const [busy, setBusy] = useState("");
  const [preview, setPreview] = useState(false);
  const [picker, setPicker] = useState(false);
  const stash = useRef({}); // MCQ options remembered per question while trying other types

  const qs = quiz.questions;
  const ci = Math.min(cur, qs.length - 1);
  const q = qs[ci];
  const set = (patch) => setQuiz((s) => ({ ...s, ...patch }));
  const updQ = (patch) => setQuiz((s) => ({ ...s, questions: s.questions.map((x, i) => (i === ci ? { ...x, ...patch } : x)) }));

  function setType(type) {
    if (type === q.type) return;
    if (q.type === "MCQ") stash.current[q.key] = { options: q.options, correctIndex: q.correctIndex };
    if (type === "TRUE_FALSE") updQ({ type, options: ["True", "False"], correctIndex: q.correctIndex > 1 ? 0 : q.correctIndex });
    else if (type === "NUMERIC") updQ({ type, options: [""], correctIndex: 0 });
    else {
      const prev = stash.current[q.key];
      updQ({ type, options: prev?.options || ["", "", "", ""], correctIndex: prev?.correctIndex ?? 0 });
    }
  }

  const setOption = (i, v) => updQ({ options: q.options.map((o, k) => (k === i ? v : o)) });
  const removeOption = (i) => updQ({ options: q.options.filter((_, k) => k !== i), correctIndex: q.correctIndex === i ? 0 : q.correctIndex > i ? q.correctIndex - 1 : q.correctIndex });

  function addQuestion() {
    setQuiz((s) => ({ ...s, questions: [...s.questions, blankQuestion()] }));
    setCur(qs.length);
  }
  function deleteQuestion() {
    if (qs.length <= 1) return app.toast("A quiz needs at least one question.", "error");
    setQuiz((s) => ({ ...s, questions: s.questions.filter((_, i) => i !== ci) }));
    setCur(Math.max(0, ci - 1));
  }

  const totalSecs = qs.reduce((a, x) => a + Number(x.seconds || 0), 0);
  const totalPts = qs.reduce((a, x) => a + Number(x.points || 0), 0);
  const sectionById = Object.fromEntries(options.sections.map((s) => [s.id, s]));

  async function save(kind) {
    const problem = validate(quiz);
    if (problem) {
      if (problem.index !== undefined) setCur(problem.index);
      return app.toast(problem.msg, "error");
    }
    const body = {
      title: quiz.title.trim(),
      mode: quiz.mode,
      labId: quiz.labId || null,
      status: kind === "draft" ? "DRAFT" : "READY",
      shuffle: quiz.shuffle,
      showLeaderboard: quiz.showLeaderboard,
      audience: quiz.mode === "LIVE" ? quiz.audience : [],
      questions: qs.map((x) => ({
        text: x.text.trim(),
        type: x.type,
        options: x.type === "NUMERIC" ? [String(x.options[0] ?? "").trim()] : x.options.map((o) => o.trim()),
        correctIndex: x.type === "NUMERIC" ? 0 : x.correctIndex,
        explanation: x.explanation.trim(),
        seconds: Number(x.seconds),
        points: Number(x.points),
      })),
    };
    setBusy(kind);
    try {
      const res = quizId ? await api.updateQuiz(quizId, body) : await api.createQuiz(body);
      const id = res.quiz.id;
      set({ status: body.status });
      if (kind === "host") {
        await hostQuiz(id, app);
        return;
      }
      app.toast(kind === "draft" ? "Draft saved" : `Saved “${body.title}”`);
      app.refresh();
      if (kind === "draft") {
        if (!quizId) navigate(path("quizzes", id, "edit"), { replace: true });
      } else {
        navigate("/quizzes");
      }
    } catch (e) {
      app.toast(e.message, "error");
    } finally {
      setBusy("");
    }
  }

  async function remove() {
    if (!window.confirm(`Delete “${quiz.title}”? Its results will be deleted too.`)) return;
    setBusy("delete");
    try {
      await api.deleteQuiz(quizId);
      app.toast("Quiz deleted");
      app.refresh();
      navigate("/quizzes");
    } catch (e) {
      app.toast(e.message, "error");
      setBusy("");
    }
  }

  const live = quiz.mode === "LIVE";

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <input
          aria-label="Quiz title"
          value={quiz.title}
          onChange={(e) => set({ title: e.target.value })}
          maxLength={120}
          placeholder="Quiz title"
          style={{ border: 0, background: "transparent", font: fr(600, 30), color: C.ink, outline: "none", borderBottom: `2px dashed ${C.border}`, padding: "2px 0", flex: "1 1 380px", minWidth: 0, maxWidth: 640 }}
        />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button variant="secondary" onClick={() => setPreview(true)} style={{ padding: "10px 18px" }}>
            Preview
          </Button>
          <Button variant="secondary" busy={busy === "draft"} disabled={!!busy} onClick={() => save("draft")} style={{ padding: "10px 18px" }}>
            Save draft
          </Button>
          {live ? (
            <Button variant="green" busy={busy === "host"} disabled={!!busy} onClick={() => save("host")}>
              Save &amp; host live
            </Button>
          ) : (
            <Button variant="green" busy={busy === "save"} disabled={!!busy} onClick={() => save("save")}>
              Save quiz
            </Button>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))", gap: 18, alignItems: "start" }}>
        {/* question list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
          {qs.map((x, i) => {
            const on = i === ci;
            return (
              <div
                key={x.key}
                {...clickable(() => setCur(i))}
                aria-current={on ? "true" : undefined}
                style={{ background: "#fff", border: `2px solid ${on ? C.purple : C.border}`, borderRadius: 14, padding: 12, cursor: "pointer", display: "flex", gap: 10, alignItems: "flex-start" }}
              >
                <div style={{ width: 24, height: 24, borderRadius: 7, background: on ? C.purple : C.page, color: on ? "#fff" : C.ink, display: "grid", placeItems: "center", font: fr(700, 12), flex: "none" }}>{i + 1}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", color: x.text ? C.ink : C.muted }}>
                    {x.text || "Untitled question"}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginTop: 3 }}>
                    {TYPE_LABEL[x.type]} · {x.seconds}s · {x.points} pts
                  </div>
                </div>
              </div>
            );
          })}
          <button className="btn" onClick={addQuestion} style={{ border: `2px dashed ${C.dashed}`, background: "transparent", color: C.muted, font: nu(800, 13), padding: 12, borderRadius: 14, cursor: "pointer" }}>
            + Add question
          </button>
        </div>

        {/* editor */}
        <div style={{ background: "#fff", border: `2px solid ${C.border}`, borderRadius: 18, padding: 22, display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={label}>
              QUESTION {ci + 1} OF {qs.length}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {TYPES.map(([t, text]) => {
                const on = q.type === t;
                return (
                  <button
                    key={t}
                    className="btn"
                    aria-pressed={on}
                    onClick={() => setType(t)}
                    style={{ border: `2px solid ${on ? C.purple : C.border}`, background: on ? C.purpleBg : "#fff", color: on ? C.purpleD : C.muted, font: nu(800, 12), padding: "6px 10px", borderRadius: 9, cursor: "pointer" }}
                  >
                    {text}
                  </button>
                );
              })}
            </div>
          </div>

          <textarea
            aria-label="Question text"
            value={q.text}
            onChange={(e) => updQ({ text: e.target.value })}
            rows={2}
            maxLength={500}
            placeholder="Type your question…"
            className="field"
            style={{ border: `2px solid ${C.border}`, borderRadius: 14, padding: 14, font: fr(600, 20, 1.3), color: C.ink, resize: "vertical", outline: "none", width: "100%" }}
          />

          {q.type === "NUMERIC" ? (
            <div>
              <div style={{ ...label, marginBottom: 6 }}>CORRECT ANSWER</div>
              <input
                className="field"
                inputMode="decimal"
                value={q.options[0] ?? ""}
                onChange={(e) => updQ({ options: [e.target.value] })}
                placeholder="e.g. 9.8"
                style={{ ...fieldStyle, border: `2px solid ${C.green}`, background: C.greenBg, font: nu(800, 16), borderRadius: 14 }}
              />
              <div style={{ ...sub, fontSize: 11, marginTop: 6 }}>Answers within 1% of this value are marked correct.</div>
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(200px, 100%), 1fr))", gap: 10 }}>
                {q.options.map((o, i) => {
                  const ok = i === q.correctIndex;
                  const fixed = q.type === "TRUE_FALSE";
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, border: `2px solid ${ok ? C.green : C.border}`, background: ok ? C.greenBg : "#fff", borderRadius: 14, padding: "10px 12px" }}>
                      <button
                        className="btn"
                        onClick={() => updQ({ correctIndex: i })}
                        title="Mark correct"
                        aria-label={`Mark option ${i + 1} correct`}
                        aria-pressed={ok}
                        style={{ width: 26, height: 26, borderRadius: "50%", border: `2px solid ${ok ? C.green : C.dashed}`, background: ok ? C.green : "#fff", color: "#fff", display: "grid", placeItems: "center", font: fr(700, 13), cursor: "pointer", flex: "none", padding: 0 }}
                      >
                        {ok ? "✓" : ""}
                      </button>
                      <input
                        aria-label={`Option ${i + 1}`}
                        value={o}
                        readOnly={fixed}
                        maxLength={200}
                        placeholder={`Option ${i + 1}`}
                        onChange={(e) => setOption(i, e.target.value)}
                        style={{ flex: 1, border: 0, background: "transparent", font: nu(700, 15), outline: "none", minWidth: 0, color: C.ink }}
                      />
                      {!fixed && q.options.length > 2 && (
                        <button className="btn" onClick={() => removeOption(i)} aria-label={`Remove option ${i + 1}`} style={{ border: 0, background: "transparent", color: C.muted, cursor: "pointer", font: nu(800, 14), padding: 0 }}>
                          ×
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              {q.type === "MCQ" && q.options.length < 6 && (
                <div>
                  <Button variant="link" size="sm" onClick={() => updQ({ options: [...q.options, ""] })}>
                    + Add option
                  </Button>
                </div>
              )}
            </>
          )}

          <div>
            <div style={{ ...label, marginBottom: 6, letterSpacing: 0 }}>EXPLANATION (shown after answer)</div>
            <input className="field" value={q.explanation} maxLength={500} onChange={(e) => updQ({ explanation: e.target.value })} style={{ ...fieldStyle, font: nu(700, 13) }} />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 800, color: C.muted }}>
                Time
                <select value={q.seconds} onChange={(e) => updQ({ seconds: Number(e.target.value) })} style={selectSm}>
                  {[...new Set([...SECONDS, q.seconds])].sort((a, b) => a - b).map((s) => (
                    <option key={s} value={s}>
                      {s} s
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 800, color: C.muted }}>
                Points
                <select value={q.points} onChange={(e) => updQ({ points: Number(e.target.value) })} style={selectSm}>
                  {[...new Set([...POINTS, q.points])].sort((a, b) => a - b).map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <Button variant="dangerLink" size="sm" onClick={deleteQuestion}>
              Delete question
            </Button>
          </div>
        </div>

        {/* settings */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
          <div style={{ background: "#fff", border: `2px solid ${C.border}`, borderRadius: 18, padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={h2}>Delivery</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                ["LIVE", "Live (teacher-hosted)", "Students join with a code; you control pacing like a live poll."],
                ["AFTER_LAB", "After lab (default quiz)", "Appears automatically when a student clears the bench."],
              ].map(([m, text, desc]) => {
                const on = quiz.mode === m;
                return (
                  <div
                    key={m}
                    {...clickable(() => set({ mode: m }))}
                    role="radio"
                    aria-checked={on}
                    style={{ border: `2px solid ${on ? C.purple : C.border}`, background: on ? C.purpleBg : "#fff", borderRadius: 14, padding: 12, cursor: "pointer", display: "flex", gap: 10 }}
                  >
                    <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${on ? C.purple : C.dashed}`, background: on ? C.purple : "#fff", flex: "none", marginTop: 1, boxShadow: "inset 0 0 0 3px #fff" }} />
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 14 }}>{text}</div>
                      <div style={{ ...sub, marginTop: 2 }}>{desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div>
              <div style={{ ...label, letterSpacing: 0, marginBottom: 6 }}>LINKED LAB{quiz.mode === "AFTER_LAB" ? " (required)" : ""}</div>
              <select className="field" value={quiz.labId} onChange={(e) => set({ labId: e.target.value })} style={{ ...fieldStyle, font: nu(800, 13) }}>
                <option value="">None</option>
                {options.labs.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title} · Class {l.grade}
                  </option>
                ))}
              </select>
            </div>

            {live ? (
              <div style={{ position: "relative" }}>
                <div style={{ ...label, letterSpacing: 0, marginBottom: 6 }}>AUDIENCE</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {quiz.audience.map((id) => {
                    const s = sectionById[id];
                    return (
                      <button
                        key={id}
                        className="btn"
                        title="Remove"
                        onClick={() => set({ audience: quiz.audience.filter((x) => x !== id) })}
                        style={{ fontSize: 12, fontWeight: 800, background: C.blue, color: "#fff", padding: "5px 10px", borderRadius: 99, border: 0, cursor: "pointer" }}
                      >
                        {s ? `Class ${s.grade} · ${s.section}` : "Section"} ×
                      </button>
                    );
                  })}
                  <button
                    className="btn"
                    aria-expanded={picker}
                    onClick={() => setPicker((p) => !p)}
                    style={{ fontSize: 12, fontWeight: 800, border: `2px dashed ${C.dashed}`, background: "transparent", color: C.muted, padding: "3px 10px", borderRadius: 99, cursor: "pointer" }}
                  >
                    {picker ? "Done" : "+ add"}
                  </button>
                </div>
                {!quiz.audience.length && <div style={{ ...sub, fontSize: 11, marginTop: 6 }}>No audience: anyone with the join code can play.</div>}
                {picker && (
                  <div style={{ marginTop: 8, border: `2px solid ${C.border}`, borderRadius: 14, padding: 10, display: "flex", flexDirection: "column", gap: 8, background: C.rowHover }}>
                    {[...new Set(options.sections.map((s) => s.grade))].map((g) => (
                      <div key={g} style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 12, fontWeight: 800, width: 62 }}>Class {g}</span>
                        {options.sections
                          .filter((s) => s.grade === g)
                          .map((s) => {
                            const on = quiz.audience.includes(s.id);
                            return (
                              <button
                                key={s.id}
                                className="btn"
                                aria-pressed={on}
                                onClick={() => set({ audience: on ? quiz.audience.filter((x) => x !== s.id) : [...quiz.audience, s.id] })}
                                style={{ border: `2px solid ${on ? C.blue : C.border}`, background: on ? C.blue : "#fff", color: on ? "#fff" : C.ink, font: fr(700, 13), padding: "4px 10px", borderRadius: 8, cursor: "pointer" }}
                              >
                                {s.section}
                              </button>
                            );
                          })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ ...sub, fontSize: 12 }}>Runs for every section the linked lab is assigned to (when “Attach default post-lab quiz” is on).</div>
            )}

            <Toggle label="Shuffle options" checked={quiz.shuffle} onChange={(v) => set({ shuffle: v })} />
            {live && <Toggle label="Show leaderboard between questions" checked={quiz.showLeaderboard} onChange={(v) => set({ showLeaderboard: v })} />}
          </div>

          <div style={{ background: C.purpleBg, border: "2px solid #D9CEFB", borderRadius: 18, padding: 16, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ ...label, color: C.purple }}>SUMMARY</div>
            <div style={{ fontWeight: 800, fontSize: 14 }}>
              {qs.length} {qs.length === 1 ? "question" : "questions"} · {fmtDuration(totalSecs)} · {totalPts} pts
            </div>
            <div style={{ ...sub, fontSize: 11 }}>{quizId ? (quiz.status === "DRAFT" ? "Saved as draft" : "Saved") : "Not saved yet"}</div>
          </div>

          {quizId && (
            <div>
              <Button variant="dangerLink" size="sm" busy={busy === "delete"} disabled={!!busy} onClick={remove}>
                Delete quiz
              </Button>
            </div>
          )}
        </div>
      </div>

      {preview && <Preview quiz={quiz} onClose={() => setPreview(false)} />}
    </>
  );
}

const selectSm = { border: `2px solid ${C.border}`, borderRadius: 10, padding: "7px 10px", font: nu(800, 13), background: "#fff", color: C.ink };

function Preview({ quiz, onClose }) {
  return (
    <Modal onClose={onClose} eyebrow="STUDENT PREVIEW" title={quiz.title || "Untitled quiz"} subtitle={`${quiz.mode === "LIVE" ? "Live quiz" : "After-lab quiz"} · ${quiz.questions.length} questions${quiz.shuffle ? " · options shuffled for students" : ""}`} width={680}>
      {quiz.questions.map((q, i) => (
        <div key={q.key} style={{ background: C.ink, color: "#fff", borderRadius: 18, padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 800, letterSpacing: ".08em", color: C.onDark }}>
            <span>
              QUESTION {i + 1} OF {quiz.questions.length}
            </span>
            <span>
              {q.seconds}s · {q.points} pts
            </span>
          </div>
          <div style={{ font: fr(600, 20, 1.25) }}>{q.text || <span style={{ color: C.onDark }}>Untitled question</span>}</div>
          {q.type === "NUMERIC" ? (
            <div style={{ background: "rgba(255,255,255,.1)", borderRadius: 12, padding: "12px 14px", color: C.onDark, fontWeight: 800, fontSize: 14 }}>Type a number…</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(200px, 100%), 1fr))", gap: 8 }}>
              {q.options.map((o, k) => (
                <div key={k} style={{ background: TILE[k % TILE.length], borderRadius: 12, padding: "12px 14px", font: fr(600, 16), minHeight: 48 }}>
                  {o || <span style={{ opacity: 0.6 }}>Option {k + 1}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </Modal>
  );
}
