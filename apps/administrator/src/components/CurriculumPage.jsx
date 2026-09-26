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
            labs: c.labs.map((l) => {
              const currentId = l.id || l.labId;
              if (currentId === labId) {
                const currentMandatory = l.isMandatory !== undefined ? l.isMandatory : Boolean(l.mandatory);
                return {
                  ...l,
                  isMandatory: !currentMandatory,
                  mandatory: !currentMandatory,
                };
              }
              return l;
            }),
          };
        })
      );
      onNotify("Lab requirement status updated.");
    } catch (er) {
      onNotify(er.message, "error");
    }
  };

  const getSubjectIcon = (subject) => {
    const s = (subject || "").toLowerCase();
    if (s.includes("phys")) return "⚛️";
    if (s.includes("chem")) return "🧪";
    if (s.includes("bio")) return "🧬";
    if (s.includes("math")) return "📐";
    return "🔬";
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Curriculum & Board Configuration</h1>
        <p className="page-subtitle">Configure which board's practical science syllabus your institution follows and toggle mandatory labs.</p>
      </div>

      {/* Board Selector */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title"><span className="card-title-icon">📋</span> Affiliated Education Board</div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          {BOARDS.map((b) => (
            <button
              key={b}
              className={`btn ${selectedBoard === b ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setSelectedBoard(b)}
              style={{ minWidth: 130, padding: "10px 18px" }}
            >
              {b === "CBSE" ? "🇮🇳 CBSE Syllabus" : "🏛️ ICSE Syllabus"}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 14, fontSize: 13, color: "var(--ink-secondary)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span>Active School Board: <strong style={{ color: "#34d399" }}>{institution?.board || "CBSE"}</strong></span>
          <span>•</span>
          <span>Viewing practical modules for: <strong style={{ color: "#34d399" }}>{selectedBoard} Curriculum</strong></span>
        </div>
      </div>

      {loading ? (
        <div className="loading-page" style={{ height: 260 }}><div className="spinner" /><span>Loading {selectedBoard} practical curriculum…</span></div>
      ) : curricula.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📚</div>
            <div className="empty-state-text">No curriculum loaded for {selectedBoard}</div>
            <div className="empty-state-sub">Select CBSE or ICSE to view configured practical labs.</div>
          </div>
        </div>
      ) : (
        curricula.map((cur) => {
          const classTitle = cur.classLabel?.toString().startsWith("Class") ? cur.classLabel : `Class ${cur.classLabel}`;
          const totalLabs = cur.labs?.length || 0;
          const mandatoryCount = (cur.labs || []).filter((l) => (l.isMandatory !== undefined ? l.isMandatory : Boolean(l.mandatory))).length;

          return (
            <div key={cur.id} className="card" style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                <div className="card-title" style={{ margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="card-title-icon">{getSubjectIcon(cur.subject)}</span>
                  <span>{classTitle} — {cur.subject}</span>
                  <span className="badge badge-cbse">{cur.board || selectedBoard}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 12.5, color: "var(--ink-muted)", fontWeight: 700 }}>
                    <span style={{ color: "#34d399" }}>{mandatoryCount}</span> of {totalLabs} Mandatory
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {cur.labs.map((lab) => {
                  const labId = lab.id || lab.labId;
                  const isMandatory = lab.isMandatory !== undefined ? lab.isMandatory : Boolean(lab.mandatory);
                  const code = lab.code || (lab.labId ? lab.labId.toUpperCase().replace("-", " ") : "LAB-EXP");
                  const domain = lab.category || lab.unit || "Practical Module";
                  const term = lab.term || "Annual Syllabus";
                  const duration = lab.durationMin ? `~${lab.durationMin} mins` : "~45 mins";

                  return (
                    <div key={labId || lab.title} className="lab-toggle-row">
                      <div className="lab-toggle-info">
                        <div className="lab-toggle-title">
                          <span>{lab.title}</span>
                        </div>
                        <div className="lab-toggle-meta">
                          <span>Code: <strong style={{ color: "#ffffff" }}>{code}</strong></span>
                          <span>•</span>
                          <span>Domain: <span style={{ color: "var(--ink-secondary)" }}>{domain}</span></span>
                          <span>•</span>
                          <span>{term}</span>
                          <span>•</span>
                          <span>{duration}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <span
                          className={`badge ${isMandatory ? "badge-active" : "badge-inactive"}`}
                          style={{ fontSize: 11.5 }}
                        >
                          {isMandatory ? "✓ Mandatory Lab" : "○ Optional Lab"}
                        </span>
                        <button
                          type="button"
                          className={`toggle${isMandatory ? " on" : ""}`}
                          onClick={() => toggleLab(cur.id, labId)}
                          aria-label={`Toggle ${lab.title}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
