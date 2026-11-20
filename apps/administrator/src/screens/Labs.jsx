import { useState } from "react";
import { api } from "../api.js";
import { useApi, useApp } from "../app-context.js";
import { dueInfo, SUBJECT_ORDER, subjectColor } from "../lib/format.js";
import { navigate, path } from "../route.js";
import { Tabs } from "../ui/bits.jsx";
import { Button } from "../ui/Button.jsx";
import { Async, Empty } from "../ui/states.jsx";
import { autoGrid, C, fr, h1, headRow, sub } from "../ui/theme.js";

const SUBJECT_KEY = "labbench.labs.subject";

export default function Labs() {
  const state = useApi(() => api.labs(), []);
  const [subject, setSubjectState] = useState(() => {
    try {
      return sessionStorage.getItem(SUBJECT_KEY) || "All";
    } catch {
      return "All";
    }
  });
  const setSubject = (s) => {
    setSubjectState(s);
    try {
      sessionStorage.setItem(SUBJECT_KEY, s);
    } catch {
      /* ignore */
    }
  };

  const labs = state.data?.labs || [];
  const present = [...new Set(labs.map((l) => l.subject))].sort((a, b) => {
    const ia = SUBJECT_ORDER.indexOf(a);
    const ib = SUBJECT_ORDER.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b);
  });
  const active = subject === "All" || present.includes(subject) ? subject : "All";

  return (
    <>
      <div style={headRow}>
        <div>
          <h1 className="h1" style={h1}>
            Lab catalog
          </h1>
          <div style={{ fontSize: 13, color: C.muted, fontWeight: 700, marginTop: 4 }}>
            {state.data ? `${labs.length} labs · works offline on student devices` : "Works offline on student devices"}
          </div>
        </div>
        {present.length > 1 && <Tabs value={active} onChange={setSubject} tabs={["All", ...present].map((s) => ({ value: s, label: s }))} />}
      </div>
      <Async state={state}>
        {() => {
          const list = labs.filter((l) => active === "All" || l.subject === active);
          return list.length ? (
            <div style={autoGrid(270, 14, "auto-fill")}>
              {list.map((l) => (
                <LabCard key={l.id} lab={l} />
              ))}
            </div>
          ) : (
            <Empty title="No labs" text="The lab catalog is empty." />
          );
        }}
      </Async>
    </>
  );
}

function LabCard({ lab }) {
  const app = useApp();
  const bg = subjectColor(lab.subject);
  const assigned = lab.assigned || [];
  const due = dueInfo(lab.dueAt);
  return (
    <div style={{ background: "#fff", border: `2px solid ${C.border}`, borderBottomWidth: 5, borderRadius: 18, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 110, background: bg, position: "relative", display: "flex", alignItems: "flex-end", padding: 14, overflow: "hidden" }}>
        <div
          aria-hidden="true"
          style={{ position: "absolute", right: 18, top: "50%", transform: "translateY(-50%)", font: fr(700, 62, 1), color: "rgba(255,255,255,.92)", textShadow: "0 4px 0 rgba(0,0,0,.12)", maxWidth: "70%", overflow: "hidden", whiteSpace: "nowrap" }}
        >
          {lab.abbr}
        </div>
        <span style={{ position: "relative", fontSize: 11, fontWeight: 800, color: "#fff", background: "rgba(0,0,0,.25)", padding: "3px 8px", borderRadius: 99 }}>
          {lab.subject} · Class {lab.grade}
        </span>
      </div>
      <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        <div style={{ fontWeight: 800, fontSize: 15 }}>{lab.title}</div>
        <div style={sub}>
          {lab.unit} · {lab.durationMinutes} min · {lab.steps} steps
        </div>
        {Array.isArray(lab.skills) && lab.skills.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {lab.skills.map((k) => (
              <span key={k} style={{ fontSize: 11, fontWeight: 800, background: C.page, padding: "3px 8px", borderRadius: 99, color: C.ink }}>
                {k}
              </span>
            ))}
          </div>
        )}
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 800, color: assigned.length ? C.green : C.muted }}>
            {assigned.length ? `Assigned to ${assigned.join(", ")}` : "Not assigned yet"}
            {assigned.length > 0 && lab.dueAt && <div style={{ color: due.color, fontWeight: 700 }}>{due.text}</div>}
          </div>
          {assigned.length > 0 && (
            <Button variant="outline" size="xs" onClick={() => navigate(path("labs", lab.id))} style={{ padding: "7px 12px" }}>
              Report
            </Button>
          )}
          {app.canEdit && (
            <Button size="xs" onClick={() => app.openAssign({ labId: lab.id, grade: lab.grade })}>
              Assign
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
