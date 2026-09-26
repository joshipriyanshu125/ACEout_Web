import { useEffect, useState } from "react";
import { getInstitution, updateInstitution } from "../services/api.js";

const BOARDS = [
  { id: "CBSE", label: "CBSE (Central Board of Secondary Education)" },
  { id: "ICSE", label: "ICSE / ISC (CISCE)" },
  { id: "State Board", label: "State Board (State Curriculum)" },
  { id: "IB", label: "International Baccalaureate (IB)" },
  { id: "Cambridge", label: "Cambridge International (IGCSE)" },
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

  const handlePhoneChange = (e) => {
    // Only allow digits and plus sign, max 13 chars
    const cleaned = e.target.value.replace(/[^0-9+]/g, "").slice(0, 13);
    onChange("phone", cleaned);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    // Validate email if present
    if (form.email) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(form.email)) {
        onNotify("Please enter a valid administrative email address with a proper domain (e.g. principal@dpsrkpuram.edu.in).", "error");
        return;
      }
    }

    // Validate phone if present
    if (form.phone) {
      const digitsOnly = form.phone.replace(/\D/g, "");
      if (digitsOnly.length < 10 || digitsOnly.length > 13) {
        onNotify("Please enter a valid contact phone number (10–13 digits).", "error");
        return;
      }
    }

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
    return <div className="loading-page"><div className="spinner" /><span>Loading institution settings…</span></div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Institution Profile & Setup</h1>
        <p className="page-subtitle">Configure your school profile, board affiliation, academic year, and campus metadata.</p>
      </div>

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* School Profile */}
        <div className="card">
          <div className="card-title"><span className="card-title-icon">🏫</span> General Institution Details</div>
          <div className="form-grid">
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label className="form-label"><span>🏛️</span> School / Institution Legal Name</label>
              <input
                className="form-input"
                value={form.name || ""}
                onChange={(e) => onChange("name", e.target.value)}
                placeholder="e.g. Delhi Public School, R.K. Puram"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label"><span>🔢</span> Institution Code / Affiliation No.</label>
              <input
                className="form-input"
                value={form.code || ""}
                onChange={(e) => onChange("code", e.target.value)}
                placeholder="e.g. DPS-RKP-2026"
              />
            </div>
            <div className="form-group">
              <label className="form-label"><span>👨‍🏫</span> Principal / Campus Head</label>
              <input
                className="form-input"
                value={form.principalName || ""}
                onChange={(e) => onChange("principalName", e.target.value)}
                placeholder="e.g. Dr. Arvind Subramanian"
              />
            </div>
            <div className="form-group">
              <label className="form-label"><span>✉️</span> Official Administrative Email</label>
              <input
                className="form-input"
                type="email"
                value={form.email || ""}
                onChange={(e) => onChange("email", e.target.value)}
                placeholder="principal@dpsrkpuram.edu.in"
              />
            </div>
            <div className="form-group">
              <label className="form-label"><span>📞</span> Official Contact Phone</label>
              <input
                className="form-input"
                type="tel"
                value={form.phone || ""}
                onChange={handlePhoneChange}
                maxLength={13}
                placeholder="+919810123456"
              />
            </div>
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label className="form-label"><span>📍</span> Campus Physical Address</label>
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
          <div className="form-grid-3">
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label className="form-label"><span>🎓</span> Primary Educational Board</label>
              <select
                className="form-select"
                value={form.board || "CBSE"}
                onChange={(e) => onChange("board", e.target.value)}
              >
                {BOARDS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label"><span>📅</span> Active Academic Year</label>
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
              <label className="form-label"><span>🏫</span> Number of Active Classes</label>
              <input
                className="form-input"
                type="number"
                min={1}
                max={30}
                value={form.classesCount || form.totalClasses || 14}
                onChange={(e) => onChange("classesCount", Number(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label className="form-label"><span>📚</span> Sections Per Class</label>
              <input
                className="form-input"
                type="number"
                min={1}
                max={12}
                value={form.sectionsPerClass || 4}
                onChange={(e) => onChange("sectionsPerClass", Number(e.target.value))}
              />
            </div>
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label className="form-label"><span>👥</span> Estimated Total Student Headcount</label>
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
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(20, 184, 166, 0.03) 100%)",
            borderColor: "rgba(16, 185, 129, 0.25)",
          }}
        >
          <div className="card-title"><span className="card-title-icon">👁</span> Institutional Metadata Live Preview</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
            {[
              { label: "Institution", value: form.name },
              { label: "Affiliation Code", value: form.code },
              { label: "Board Affiliation", value: form.board },
              { label: "Academic Session", value: form.academicYear },
              { label: "Principal", value: form.principalName },
              { label: "Contact Email", value: form.email },
            ].map((r) => (
              <div key={r.label} className="info-row">
                <span className="info-row-label">{r.label}</span>
                <span className="info-row-value">{r.value || "—"}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="form-actions" style={{ marginTop: 4 }}>
          <button
            type="submit"
            id="btn-save-institution"
            className="btn btn-primary"
            disabled={saving}
            style={{ minWidth: 200, padding: "12px 24px", fontSize: "14px" }}
          >
            {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving Changes…</> : "💾 Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
