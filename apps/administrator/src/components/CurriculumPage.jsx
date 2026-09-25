import { useEffect, useState } from "react";
import { getCurriculum, updateCurriculum } from "../services/api.js";

const BOARDS = ["CBSE", "ICSE"];

export function CurriculumPage({ institution, onNotify }) {
  const [curricula, setCurricula] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBoard, setSelectedBoard] = useState(institution?.board || "CBSE");

  useEffect(() => {
    setLoading(true);
    getCurriculum(selectedBoard)
      .then((d) => setCurricula(d.curricula || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedBoard]);

  const toggleLab = async (curId, labId) => {
    try {
      await updateCurriculum(curId, { labId });
      setCurricula((prev) =>
        prev.map((c) => {
          if (c.id !== curId) return c;
          return {
            ...c,
            labs: c.labs.map((l) => (l.id === labId ? { ...l, isMandatory: !l.isMandatory } : l)),
          };
        })
      );
      onNotify("Lab requirement updated for syllabus.");
    } catch (er) {
      onNotify(er.message, "error");
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Curriculum & Board Configuration</h1>
        <p className="page-subtitle">Configure which board's practical science syllabus your institution follows and toggle mandatory labs.</p>
      </div>

      {/* Board Selector */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-title"><span className="card-title-icon">📋</span> Affiliated Education Board</div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {BOARDS.map((b) => (
            <button
              key={b}
              className={`btn ${selectedBoard === b ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setSelectedBoard(b)}
              style={{ minWidth: 100 }}
            >
              {b} Syllabus
            </button>
          ))}
        </div>
        <div style={{ marginTop: 12, fontSize: 13, color: "var(--txt-muted)" }}>
          Active School Board: <strong style={{ color: "var(--clr-accent)" }}>{institution?.board || "CBSE"}</strong> · Viewing practical modules for: <strong style={{ color: "var(--clr-accent)" }}>{selectedBoard}</strong>
        </div>
      </div>

      {loading ? (
        <div className="loading-page" style={{ height: 200 }}><div className="spinner" /></div>
      ) : curricula.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📚</div>
            <div className="empty-state-text">No curriculum loaded for {selectedBoard}</div>
            <div className="empty-state-sub">Select CBSE or ICSE to view configured practical labs.</div>
          </div>
        </div>
      ) : (
        curricula.map((cur) => (
          <div key={cur.id} className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div className="card-title" style={{ margin: 0 }}>
                <span className="card-title-icon">🧪</span>
                {cur.classLabel} — {cur.subject}
                <span className="badge badge-cbse" style={{ marginLeft: 8 }}>{cur.board}</span>
              </div>
              <span style={{ fontSize: 12, color: "var(--txt-muted)", fontWeight: 600 }}>
                {cur.labs.filter((l) => l.isMandatory).length} of {cur.labs.length} Mandatory
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {cur.labs.map((lab) => (
                <div key={lab.id || lab.code} className="lab-toggle-row">
                  <div className="lab-toggle-info">
                    <div className="lab-toggle-title">{lab.title}</div>
                    <div className="lab-toggle-meta">
                      Code: <strong style={{ color: "var(--txt-primary)" }}>{lab.code}</strong> · Domain: {lab.category} · {lab.term} · ~{lab.durationMin} mins
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: lab.isMandatory ? "var(--clr-success)" : "var(--txt-muted)",
                      }}
                    >
                      {lab.isMandatory ? "✓ Mandatory" : "○ Optional"}
                    </span>
                    <button
                      className={`toggle${lab.isMandatory ? " on" : ""}`}
                      onClick={() => toggleLab(cur.id, lab.id)}
                      aria-label={`Toggle ${lab.title}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
