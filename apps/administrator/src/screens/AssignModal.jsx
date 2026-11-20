import { useState } from "react";
import { api } from "../api.js";
import { useApi, useApp } from "../app-context.js";
import { isoDay } from "../lib/format.js";
import { Toggle } from "../ui/bits.jsx";
import { Button } from "../ui/Button.jsx";
import { Modal } from "../ui/Modal.jsx";
import { Async } from "../ui/states.jsx";
import { C, fieldStyle, fr, label, nu } from "../ui/theme.js";

const HINTS = [
  ["GUIDED", "Guided (show instrument tips)"],
  ["STANDARD", "Standard"],
  ["EXAM", "Exam mode (no hints)"],
];

/**
 * Assign a lab to one or more sections of a grade.
 * Props: labId? grade? classIds? pickLab? (show a lab picker), onClose.
 */
export default function AssignModal(props) {
  const state = useApi(() => Promise.all([api.options(), api.labs()]).then(([o, l]) => ({ sections: o.sections, labs: l.labs })), []);
  if (!state.data) {
    return (
      <Modal onClose={props.onClose} eyebrow="ASSIGN LAB" title="Assign a lab">
        <Async state={state}>{() => null}</Async>
      </Modal>
    );
  }
  return <AssignForm {...props} data={state.data} />;
}

function AssignForm({ labId: initialLab, grade: initialGrade, classIds: initialIds, pickLab, onClose, data }) {
  const app = useApp();
  const { sections, labs } = data;
  const grades = [...new Set(sections.map((s) => s.grade))].sort((a, b) => a - b);

  const startGrade = grades.includes(Number(initialGrade)) ? Number(initialGrade) : grades[0];
  const startLab = labs.find((l) => l.id === initialLab) || labs.find((l) => l.grade === startGrade) || labs[0];
  const inGrade = (g) => sections.filter((s) => s.grade === g);
  const startIds = initialIds?.length ? initialIds.filter((id) => sections.some((s) => s.id === id)) : inGrade(startGrade).slice(0, 1).map((s) => s.id);

  const [labId, setLabId] = useState(startLab?.id);
  const [grade, setGrade] = useState(startGrade);
  const [picked, setPicked] = useState(startIds);
  const [dueAt, setDueAt] = useState(isoDay(7));
  const [hintLevel, setHintLevel] = useState("GUIDED");
  const [attachQuiz, setAttachQuiz] = useState(true);
  const [allowOffline, setAllowOffline] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const lab = labs.find((l) => l.id === labId);
  const gradeSections = inGrade(grade);
  const chosen = gradeSections.filter((s) => picked.includes(s.id));
  const count = chosen.reduce((n, s) => n + s.students, 0);

  if (!grades.length || !lab) {
    return (
      <Modal onClose={onClose} eyebrow="ASSIGN LAB" title="Nothing to assign">
        <div style={{ fontSize: 14, fontWeight: 700, color: C.muted }}>{!grades.length ? "You don't have any sections to assign labs to." : "The lab catalog is empty."}</div>
      </Modal>
    );
  }

  function pickGrade(g) {
    setGrade(g);
    // Keep the same section letters where the new grade has them.
    const letters = sections.filter((s) => picked.includes(s.id)).map((s) => s.section);
    const next = inGrade(g).filter((s) => letters.includes(s.section));
    setPicked((next.length ? next : inGrade(g).slice(0, 1)).map((s) => s.id));
  }

  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  async function submit() {
    if (!chosen.length) return setError("Pick at least one section.");
    setBusy(true);
    setError("");
    try {
      const res = await api.assign({ labId: lab.id, classIds: chosen.map((s) => s.id), dueAt: dueAt || null, hintLevel, attachQuiz, allowOffline });
      app.toast(`Assigned “${lab.title}” to ${res.students} students`);
      app.refresh();
      onClose();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <Modal onClose={onClose} eyebrow="ASSIGN LAB" title={lab.title} subtitle={`${lab.subject} · ${lab.unit} · ${lab.durationMinutes} min`}>
      {pickLab && (
        <label style={{ display: "flex", flexDirection: "column", gap: 6, ...label }}>
          LAB
          <select className="field" value={labId} onChange={(e) => setLabId(e.target.value)} style={{ ...fieldStyle, letterSpacing: 0 }}>
            {[...labs]
              .sort((a, b) => (a.grade === grade ? 0 : 1) - (b.grade === grade ? 0 : 1))
              .map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title} · {l.subject} · Class {l.grade}
                </option>
              ))}
          </select>
        </label>
      )}

      <div>
        <div style={{ ...label, marginBottom: 8 }}>CLASS</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {grades.map((g) => {
            const on = g === grade;
            return (
              <button
                key={g}
                className="btn"
                aria-pressed={on}
                onClick={() => pickGrade(g)}
                style={{ border: `2px solid ${on ? C.blue : C.border}`, background: on ? C.blue : "#fff", color: on ? "#fff" : C.ink, font: nu(800, 13), padding: "8px 14px", borderRadius: 10, cursor: "pointer" }}
              >
                Class {g}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div style={{ ...label, marginBottom: 8 }}>SECTIONS</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {gradeSections.map((s) => {
            const on = picked.includes(s.id);
            return (
              <button
                key={s.id}
                className="btn"
                aria-pressed={on}
                onClick={() => toggle(s.id)}
                style={{ flex: "1 1 80px", border: `2px solid ${on ? C.green : C.border}`, background: on ? C.greenBg : "#fff", color: on ? C.greenD : C.ink, font: fr(700, 16), padding: 10, borderRadius: 12, cursor: "pointer" }}
              >
                {s.section}
                <div style={{ font: nu(700, 11), opacity: 0.8 }}>{s.students} students</div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(200px, 100%), 1fr))", gap: 12 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 6, ...label }}>
          DUE DATE
          <input className="field" type="date" value={dueAt} min={isoDay(0)} onChange={(e) => setDueAt(e.target.value)} style={{ ...fieldStyle, letterSpacing: 0 }} />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 6, ...label }}>
          HINT LEVEL
          <select className="field" value={hintLevel} onChange={(e) => setHintLevel(e.target.value)} style={{ ...fieldStyle, letterSpacing: 0 }}>
            {HINTS.map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>

      <Toggle boxed label="Attach default post-lab quiz (5 questions)" checked={attachQuiz} onChange={setAttachQuiz} />
      <Toggle boxed label="Allow offline completion (syncs when online)" checked={allowOffline} onChange={setAllowOffline} />

      {error && (
        <div role="alert" style={{ color: C.red, fontSize: 13, fontWeight: 800 }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: C.muted }}>
          {count} students in Class {grade}
          {chosen.length ? ` · Sec ${chosen.map((s) => s.section).sort().join(", ")}` : " · no section picked"}
        </div>
        <Button onClick={submit} busy={busy} disabled={!chosen.length} style={{ font: nu(800, 15), padding: "13px 24px" }}>
          Assign lab
        </Button>
      </div>
    </Modal>
  );
}
