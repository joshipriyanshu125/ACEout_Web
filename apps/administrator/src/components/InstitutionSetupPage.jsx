import { useEffect, useState } from "react";
import { getInstitution, updateInstitution } from "../services/api.js";

const BOARDS = [
  "CBSE (Central Board of Secondary Education)",
  "ICSE / ISC (CISCE)",
  "State Board (Maharashtra)",
  "State Board (Karnataka)",
  "State Board (Tamil Nadu)",
  "State Board (Delhi / DBSE)",
  "International Baccalaureate (IB)",
  "Cambridge (IGCSE)",
];

const YEARS = ["2025-2026", "2026-2027", "2027-2028"];

export function InstitutionSetupPage({ session, institution, onInstitutionUpdate, onNotify }) {
  const instId = session?.admin?.institutionId || "inst-1";
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (institution) {
      setForm({ ...institution });
      return;
    }
    getInstitution(instId)
      .then((d) => setForm({ ...d.institution }))
      .catch(() => {});
  }, [institution, instId]);

  const onChange = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = await updateInstitution(instId, form);
      onInstitutionUpdate(data.institution);
      onNotify("Institution profile & academic configuration saved successfully.");
    } catch (err) {
      onNotify(err.message || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  if (!form) {
    return <div className="loading-page"><div className="spinner" /><span>Loading institution…</span></div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Institution Profile & Setup</h1>
        <p className="page-subtitle">Configure your school profile, board affiliation, academic year, and campus metadata.</p>
      </div>

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* School Profile */}
        <div className="card">
          <div className="card-title"><span className="card-title-icon">🏫</span> General Institution Details</div>
          <div className="form-grid" style={{ gap: 16 }}>
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label className="form-label">School / Institution Legal Name</label>
              <input
                className="form-input"
                value={form.name || ""}
                onChange={(e) => onChange("name", e.target.value)}
                placeholder="e.g. Delhi Public School, R.K. Puram"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Institution Code / Affiliation No.</label>
              <input
                className="form-input"
                value={form.code || ""}
                onChange={(e) => onChange("code", e.target.value)}
                placeholder="e.g. CBSE-AFF-2730018"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Principal / Campus Head</label>
              <input
                className="form-input"
                value={form.principalName || ""}
                onChange={(e) => onChange("principalName", e.target.value)}
                placeholder="e.g. Dr. Arvind Subramanian"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Official Administrative Email</label>
              <input
                className="form-input"
                type="email"
                value={form.email || ""}
                onChange={(e) => onChange("email", e.target.value)}
                placeholder="principal@dpsrkpuram.edu.in"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Official Contact Phone</label>
              <input
                className="form-input"
                value={form.phone || ""}
                onChange={(e) => onChange("phone", e.target.value)}
                placeholder="+91 11 2617 7087"
              />
            </div>
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label className="form-label">Campus Physical Address</label>
              <input
                className="form-input"
                value={form.address || ""}
                onChange={(e) => onChange("address", e.target.value)}
                placeholder="Sector XII, R.K. Puram, New Delhi, Delhi 110022"
              />
            </div>
          </div>
        </div>

        {/* Board & Academic Config */}
        <div className="card">
          <div className="card-title"><span className="card-title-icon">📋</span> Academic & Board Configuration</div>
          <div className="form-grid-3" style={{ gap: 16 }}>
            <div className="form-group" style={{ gridColumn: "1 / 3" }}>
              <label className="form-label">Primary Educational Board</label>
              <select
                className="form-select"
                value={form.board || "CBSE"}
                onChange={(e) => onChange("board", e.target.value.split(" ")[0])}
              >
                {BOARDS.map((b) => (
                  <option key={b} value={b.split(" ")[0]}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Active Academic Year</label>
              <select
                className="form-select"
                value={form.academicYear || "2026-2027"}
                onChange={(e) => onChange("academicYear", e.target.value)}
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Number of Active Classes</label>
              <input
                className="form-input"
                type="number"
                min={1}
                max={30}
                value={form.classesCount || 14}
                onChange={(e) => onChange("classesCount", Number(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Sections Per Class</label>
              <input
                className="form-input"
                type="number"
                min={1}
                max={12}
                value={form.sectionsPerClass || 4}
                onChange={(e) => onChange("sectionsPerClass", Number(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Estimated Student Headcount</label>
              <input
                className="form-input"
                type="number"
                value={form.totalStudentsCount || 1280}
                onChange={(e) => onChange("totalStudentsCount", Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        {/* Profile preview summary */}
        <div
          className="card"
          style={{
            background: "linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(99, 102, 241, 0.04) 100%)",
            borderColor: "rgba(59, 130, 246, 0.2)",
          }}
        >
          <div className="card-title"><span className="card-title-icon">👁</span> Institutional Metadata Summary</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
            {[
              { label: "Institution", value: form.name },
              { label: "Affiliation Code", value: form.code },
              { label: "Board Affiliation", value: form.board },
              { label: "Academic Session", value: form.academicYear },
              { label: "Principal", value: form.principalName },
              { label: "Contact", value: form.email },
            ].map((r) => (
              <div key={r.label} className="info-row">
                <span className="info-row-label">{r.label}</span>
                <span className="info-row-value">{r.value || "—"}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            id="btn-save-institution"
            className="btn btn-primary"
            disabled={saving}
            style={{ minWidth: 180, padding: "11px 22px" }}
          >
            {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving…</> : "💾 Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
